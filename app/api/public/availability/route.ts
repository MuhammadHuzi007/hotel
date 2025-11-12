import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computePricing } from '@/lib/pricing'
import { toNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotelId = parseInt(searchParams.get('hotelId') || '1')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut dates are required' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'checkIn must be before checkOut' },
        { status: 400 }
      )
    }

    // Get room types with available rooms
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId },
      include: {
        rooms: {
          where: {
            status: 'vacant_clean',
          }
        }
      }
    })

    // Find overlapping bookings
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        hotelId,
        status: { in: ['booked', 'checked_in'] },
        OR: [
          {
            AND: [
              { checkIn: { lte: checkOutDate } },
              { checkOut: { gte: checkInDate } },
            ],
          },
        ],
      },
      select: { roomId: true },
    })

    const bookedRoomIds = new Set(overlappingBookings.map(b => b.roomId))

    // Build availability response with pricing
    const availability = []

    for (const roomType of roomTypes) {
      const availableRooms = roomType.rooms.filter(room => !bookedRoomIds.has(room.id))
      
      if (availableRooms.length > 0) {
        // Compute pricing for this room type
        const pricing = await computePricing({
          hotelId,
          roomTypeId: roomType.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
        })

        availability.push({
          roomType: {
            id: roomType.id,
            name: roomType.name,
            baseRate: toNumber(roomType.baseRate),
            capacity: roomType.capacity,
            desc: roomType.desc,
          },
          availableCount: availableRooms.length,
          nightlyBreakdown: pricing.nightlyBreakdown,
          nightlyTotal: toNumber(pricing.nightlyTotal),
          estimatedTotal: toNumber(pricing.grandTotal), // Includes taxes/fees
        })
      }
    }

    return NextResponse.json({
      hotelId,
      checkIn,
      checkOut,
      availability,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check availability' },
      { status: 500 }
    )
  }
}

