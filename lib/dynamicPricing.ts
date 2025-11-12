import { prisma } from './prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { toNumber } from './utils'
import { logger } from './logger'
import { eachDayOfInterval } from 'date-fns'

export interface PricingMatrix {
  roomTypeId: number
  roomTypeName: string
  dates: Array<{
    date: string
    baseRate: number
    adjustedRate: number
    reason?: string
  }>
}

export interface PricingContext {
  hotelId: number
  roomTypeId?: number
  startDate: Date
  endDate: Date
}

// Compute occupancy percentage for a date range
async function computeOccupancy(
  hotelId: number,
  roomTypeId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      rooms: {
        where: { hotelId },
      },
    },
  })

  if (!roomType || roomType.rooms.length === 0) {
    return 0
  }

  const totalRooms = roomType.rooms.length

  // Count occupied rooms in date range
  const occupiedBookings = await prisma.booking.count({
    where: {
      hotelId,
      roomId: { in: roomType.rooms.map((r) => r.id) },
      status: { in: ['booked', 'checked_in'] },
      OR: [
        {
          AND: [
            { checkIn: { lte: endDate } },
            { checkOut: { gte: startDate } },
          ],
        },
      ],
    },
  })

  // Simple occupancy: occupied bookings / total rooms
  // In production, this would be more sophisticated (room-nights)
  return Math.min((occupiedBookings / totalRooms) * 100, 100)
}

// Apply pricing rules to a rate
function applyPricingRules(
  baseRate: number,
  rules: Array<{
    minOccPct: number | null
    delta: Decimal | null
    pct: number | null
    minRate: Decimal | null
    maxRate: Decimal | null
    name: string
  }>,
  occupancy: number
): { adjustedRate: number; reason?: string } {
  let adjustedRate = baseRate
  let reason: string | undefined

  for (const rule of rules) {
    // Check if rule applies (occupancy threshold)
    if (rule.minOccPct !== null && occupancy < rule.minOccPct) {
      continue
    }

    // Apply delta or percentage adjustment
    if (rule.delta !== null) {
      adjustedRate += toNumber(rule.delta)
      reason = `${rule.name}: +$${toNumber(rule.delta).toFixed(2)}`
    } else if (rule.pct !== null) {
      const adjustment = baseRate * (rule.pct / 100)
      adjustedRate += adjustment
      reason = `${rule.name}: ${rule.pct > 0 ? '+' : ''}${rule.pct}%`
    }

    // Clamp to min/max
    if (rule.minRate !== null) {
      adjustedRate = Math.max(adjustedRate, toNumber(rule.minRate))
    }
    if (rule.maxRate !== null) {
      adjustedRate = Math.min(adjustedRate, toNumber(rule.maxRate))
    }

    // Only apply first matching rule
    break
  }

  return { adjustedRate, reason }
}

// Generate pricing matrix for hotel/roomType
export async function generatePricingMatrix(
  context: PricingContext
): Promise<PricingMatrix[]> {
  const { hotelId, roomTypeId, startDate, endDate } = context

  // Get room types
  const roomTypes = roomTypeId
    ? await prisma.roomType.findMany({
        where: { id: roomTypeId, hotelId },
      })
    : await prisma.roomType.findMany({
        where: { hotelId },
      })

  const matrices: PricingMatrix[] = []

  for (const roomType of roomTypes) {
    const baseRate = toNumber(roomType.baseRate)

    // Get active pricing rules for this room type
    const rules = await prisma.pricingRule.findMany({
      where: {
        hotelId,
        roomTypeId: roomType.id,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generate dates
    const dates = eachDayOfInterval({ start: startDate, end: endDate })

    const datePricing = await Promise.all(
      dates.map(async (date) => {
        // Compute occupancy for this date (simplified: use date range average)
        const occupancy = await computeOccupancy(hotelId, roomType.id, startDate, endDate)

        // Apply rules
        const { adjustedRate, reason } = applyPricingRules(
          baseRate,
          rules.map((r) => ({
            minOccPct: r.minOccPct,
            delta: r.delta,
            pct: r.pct,
            minRate: r.minRate,
            maxRate: r.maxRate,
            name: r.name,
          })),
          occupancy
        )

        return {
          date: date.toISOString().split('T')[0],
          baseRate,
          adjustedRate: Math.round(adjustedRate * 100) / 100,
          reason,
        }
      })
    )

    matrices.push({
      roomTypeId: roomType.id,
      roomTypeName: roomType.name,
      dates: datePricing,
    })
  }

  return matrices
}

// Recompute and update rates (called by job)
export async function recomputeRates(hotelId: number): Promise<void> {
  logger.info({ hotelId }, 'Starting rate recomputation')

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 60) // Next 60 days

  const matrices = await generatePricingMatrix({
    hotelId,
    startDate,
    endDate,
  })

  // Update allotments with new rates (or create cache table)
  // For MVP, we'll just log the matrix
  logger.info({ hotelId, roomTypes: matrices.length }, 'Rate recomputation completed')

  // In production, you might:
  // 1. Store in a RateCache table
  // 2. Push to OTAs via adapters
  // 3. Update Allotment records

  // Push to OTAs if enabled
  if (process.env.OTAS_ENABLED === 'true') {
    const { createOtaAdapter } = await import('./otas/mockOta')
    try {
      const adapter = createOtaAdapter('mock_ota')
      await adapter.pushRatesAndAvailability(hotelId)
    } catch (error) {
      logger.error({ hotelId, error }, 'Failed to push rates to OTA')
    }
  }
}

