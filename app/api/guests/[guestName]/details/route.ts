import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { toNumber } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { guestName: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hotelId = parseInt(request.cookies.get('activeHotelId')?.value || '1')
    const guestName = decodeURIComponent(params.guestName)

    // Get all bookings for this guest (completed and cancelled)
    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        guestName: guestName,
        status: { in: ['completed', 'cancelled'] },
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            pricePerNight: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        ratePlan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { checkOut: 'desc' },
    })

    // Calculate totals
    const totalBookings = bookings.length
    const totalSpent = bookings.reduce((sum, b) => sum + toNumber(b.grandTotal || b.totalAmount), 0)
    const totalServices = bookings.reduce((sum, b) => {
      return sum + b.services.reduce((s, sv) => s + toNumber(sv.totalPrice), 0)
    }, 0)
    const totalPayments = bookings.reduce((sum, b) => {
      return sum + b.payments.reduce((p, pay) => p + toNumber(pay.amount), 0)
    }, 0)

    // Get guest info from first booking
    const guestInfo = bookings.length > 0 ? {
      guestName: bookings[0].guestName,
      guestEmail: bookings[0].guestEmail,
      guestPhone: bookings[0].guestPhone,
    } : null

    return NextResponse.json({
      guest: guestInfo,
      bookings,
      summary: {
        totalBookings,
        totalSpent,
        totalServices,
        totalPayments,
        firstVisit: bookings.length > 0 ? bookings[bookings.length - 1].checkIn.toISOString() : null,
        lastVisit: bookings.length > 0 ? bookings[0].checkOut.toISOString() : null,
      },
    })
  } catch (error) {
    console.error('Guest details fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

