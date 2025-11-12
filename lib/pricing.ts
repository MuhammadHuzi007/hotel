import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from './prisma'
import { toNumber } from './utils'
import { eachDayOfInterval, isWeekend, format } from 'date-fns'

export interface PricingInput {
  hotelId: number
  roomTypeId?: number
  roomId?: number
  ratePlanId?: number
  checkIn: Date
  checkOut: Date
}

export interface NightlyBreakdown {
  date: string
  baseRate: number
  seasonAdjustment: number
  weekendSurcharge: number
  finalRate: number
}

export interface PricingResult {
  nightlyBreakdown: NightlyBreakdown[]
  nightlyTotal: Decimal
  taxTotal: Decimal
  feeTotal: Decimal
  grandTotal: Decimal
}

export async function computeNightlyBreakdown(input: PricingInput): Promise<NightlyBreakdown[]> {
  const { hotelId, roomTypeId, roomId, ratePlanId, checkIn, checkOut } = input

  // Get base rate
  let baseRate: number
  if (roomTypeId) {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId }
    })
    if (!roomType) throw new Error('Room type not found')
    baseRate = toNumber(roomType.baseRate)
  } else if (roomId) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { type: true }
    })
    if (!room) throw new Error('Room not found')
    if (room.type) {
      baseRate = toNumber(room.type.baseRate)
    } else {
      baseRate = toNumber(room.pricePerNight)
    }
  } else {
    throw new Error('Either roomTypeId or roomId required')
  }

  // Get rate plan for weekend surcharge
  let weekendSurcharge = 0
  if (ratePlanId) {
    const ratePlan = await prisma.ratePlan.findUnique({
      where: { id: ratePlanId }
    })
    if (ratePlan?.weekendSurcharge) {
      weekendSurcharge = toNumber(ratePlan.weekendSurcharge)
    }
  }

  // Get seasons
  const seasons = await prisma.season.findMany({
    where: {
      hotelId,
      startDate: { lte: checkOut },
      endDate: { gte: checkIn }
    }
  })

  // Generate all nights
  const nights = eachDayOfInterval({ start: checkIn, end: new Date(checkOut.getTime() - 24 * 60 * 60 * 1000) })

  const breakdown: NightlyBreakdown[] = nights.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isWeekendDay = isWeekend(date)

    // Find applicable season
    let seasonAdjustment = 0
    for (const season of seasons) {
      if (date >= season.startDate && date <= season.endDate) {
        if (season.percentDelta) {
          seasonAdjustment = baseRate * (season.percentDelta / 100)
        } else {
          seasonAdjustment = toNumber(season.rateDelta)
        }
        break
      }
    }

    const weekendCharge = isWeekendDay ? weekendSurcharge : 0
    const finalRate = baseRate + seasonAdjustment + weekendCharge

    return {
      date: dateStr,
      baseRate,
      seasonAdjustment,
      weekendSurcharge: weekendCharge,
      finalRate
    }
  })

  return breakdown
}

export async function applyTaxesAndFees(
  hotelId: number,
  nightlyTotal: Decimal,
  servicesTotal: Decimal = new Decimal(0)
): Promise<{ taxTotal: Decimal; feeTotal: Decimal; grandTotal: Decimal }> {
  const [taxes, fees] = await Promise.all([
    prisma.tax.findMany({ where: { hotelId } }),
    prisma.fee.findMany({ where: { hotelId } })
  ])

  // Calculate taxes (percentage of nightlyTotal + servicesTotal)
  let taxTotal = new Decimal(0)
  const taxableBase = toNumber(nightlyTotal) + toNumber(servicesTotal)
  
  for (const tax of taxes) {
    const taxAmount = taxableBase * (toNumber(tax.percent) / 100)
    taxTotal = taxTotal.plus(taxAmount)
  }

  // Calculate fees
  let feeTotal = new Decimal(0)
  // Note: For per-night fees, we'd need number of nights, but for MVP we'll assume per-stay
  for (const fee of fees) {
    if (!fee.perNight) {
      feeTotal = feeTotal.plus(fee.amount)
    }
    // TODO: Handle per-night fees if needed
  }

  const grandTotal = nightlyTotal.plus(taxTotal).plus(feeTotal).plus(servicesTotal)

  return {
    taxTotal,
    feeTotal,
    grandTotal
  }
}

export async function computePricing(input: PricingInput): Promise<PricingResult> {
  const nightlyBreakdown = await computeNightlyBreakdown(input)
  
  // Sum nightly rates
  const nightlyTotal = nightlyBreakdown.reduce(
    (sum, night) => sum.plus(night.finalRate),
    new Decimal(0)
  )

  // Apply taxes and fees (services will be added later)
  const { taxTotal, feeTotal, grandTotal } = await applyTaxesAndFees(
    input.hotelId,
    nightlyTotal,
    new Decimal(0)
  )

  return {
    nightlyBreakdown,
    nightlyTotal,
    taxTotal,
    feeTotal,
    grandTotal
  }
}

