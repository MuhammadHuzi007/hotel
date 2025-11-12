import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const hotelId = parseInt(searchParams.get('hotelId') || '1')

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

    // Find rooms that are vacant_clean
    const availableRooms = await prisma.room.findMany({
      where: {
        hotelId,
        status: 'vacant_clean',
      },
    })

    // Find bookings that overlap with the requested dates
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

    // Filter out rooms that have overlapping bookings
    const trulyAvailable = availableRooms.filter(
      room => !bookedRoomIds.has(room.id)
    )

    return NextResponse.json(trulyAvailable)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check availability' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

