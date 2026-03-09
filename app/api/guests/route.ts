import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { toNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hotelId = parseInt(request.cookies.get('activeHotelId')?.value || '1')

    // Get only currently checked-in guests (not checked out yet)
    const bookings = await prisma.booking.findMany({
      where: { 
        hotelId,
        status: { in: ['booked', 'checked_in'] } // Only active bookings
      },
      include: {
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
      orderBy: { checkIn: 'desc' },
    })

    // Group bookings by guest (name + email combination)
    const guestMap = new Map<string, any>()

    bookings.forEach((booking) => {
      const guestKey = `${booking.guestName}|${booking.guestEmail || ''}`
      
      if (!guestMap.has(guestKey)) {
        guestMap.set(guestKey, {
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          totalBookings: 0,
          totalSpent: 0,
          lastVisit: null,
          bookings: [],
        })
      }

      const guest = guestMap.get(guestKey)!
      guest.totalBookings += 1
      guest.totalSpent += toNumber(booking.totalAmount)
      
      if (!guest.lastVisit || new Date(booking.checkIn) > new Date(guest.lastVisit)) {
        guest.lastVisit = booking.checkIn.toISOString()
      }
      
      guest.bookings.push({
        id: booking.id,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        status: booking.status,
        totalAmount: booking.totalAmount,
        room: booking.room,
      })
    })

    const guests = Array.from(guestMap.values()).sort((a, b) => {
      return new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime()
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Guests fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

