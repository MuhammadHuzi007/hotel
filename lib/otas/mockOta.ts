import { prisma } from '../prisma'
import { Channel } from '@prisma/client'
import { logger } from '../logger'

// Mock OTA adapter for testing
export class MockOtaAdapter {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OTA_MOCK_API_KEY || 'mock-ota-key'
  }

  // Push rates and availability to mock OTA
  async pushRatesAndAvailability(hotelId: number): Promise<void> {
    logger.info({ hotelId }, 'Pushing rates and availability to Mock OTA')

    const links = await prisma.externalChannelLink.findMany({
      where: {
        hotelId,
        provider: 'mock_ota',
        isActive: true,
      },
      include: {
        roomType: true,
      },
    })

    // Get allotments for next 60 days
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 60)

    for (const link of links) {
      if (!link.roomType) continue

      const allotments = await prisma.allotment.findMany({
        where: {
          hotelId,
          roomTypeId: link.roomTypeId!,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      // Mock API call - in real implementation, this would POST to OTA API
      logger.debug(
        {
          hotelId,
          externalId: link.externalId,
          roomType: link.roomType.name,
          allotments: allotments.length,
        },
        'Mock OTA: Rates and availability pushed'
      )

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    logger.info({ hotelId }, 'Mock OTA: Rates and availability push completed')
  }

  // Pull reservations from mock OTA
  async pullReservations(hotelId: number): Promise<number> {
    logger.info({ hotelId }, 'Pulling reservations from Mock OTA')

    // Mock: Return deterministic test reservations
    const mockReservations = [
      {
        externalId: 'MOCK-001',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        roomTypeName: 'Double',
        totalAmount: 300.0,
      },
    ]

    let created = 0

    for (const reservation of mockReservations) {
      // Find room type
      const roomType = await prisma.roomType.findFirst({
        where: {
          hotelId,
          name: reservation.roomTypeName,
        },
        include: {
          rooms: {
            where: {
              hotelId,
              status: 'vacant_clean',
            },
            take: 1,
          },
        },
      })

      if (!roomType || roomType.rooms.length === 0) {
        logger.warn({ hotelId, roomType: reservation.roomTypeName }, 'No available room for mock reservation')
        continue
      }

      // Check if booking already exists (idempotency)
      const existing = await prisma.booking.findFirst({
        where: {
          hotelId,
          channel: 'mock_ota',
          externalRef: reservation.externalId,
        },
      })

      if (existing) {
        logger.debug({ hotelId, externalId: reservation.externalId }, 'Mock reservation already exists')
        continue
      }

      // Create booking
      const room = roomType.rooms[0]
      const nights = Math.ceil(
        (reservation.checkOut.getTime() - reservation.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )

      await prisma.booking.create({
        data: {
          hotelId,
          roomId: room.id,
          guestName: reservation.guestName,
          guestEmail: reservation.guestEmail,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          channel: 'mock_ota',
          externalRef: reservation.externalId,
          status: 'booked',
          nightlyTotal: reservation.totalAmount,
          taxTotal: 0,
          feeTotal: 0,
          serviceTotal: 0,
          grandTotal: reservation.totalAmount,
          totalAmount: reservation.totalAmount,
        },
      })

      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'reserved' },
      })

      created++
      logger.info({ hotelId, externalId: reservation.externalId }, 'Mock reservation created')
    }

    logger.info({ hotelId, created }, 'Mock OTA: Reservations pull completed')
    return created
  }
}

// Factory function
export function createOtaAdapter(provider: Channel, apiKey?: string) {
  switch (provider) {
    case 'mock_ota':
      return new MockOtaAdapter(apiKey)
    case 'booking_com':
      // TODO: Implement Booking.com adapter
      throw new Error('Booking.com adapter not yet implemented')
    case 'airbnb':
      // TODO: Implement Airbnb adapter
      throw new Error('Airbnb adapter not yet implemented')
    default:
      throw new Error(`Unknown OTA provider: ${provider}`)
  }
}

