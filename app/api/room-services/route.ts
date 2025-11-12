import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { toNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const body = await request.json()
    const { bookingId, serviceId, quantity = 1 } = body

    if (!bookingId || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify booking exists and is active
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot add services to completed or cancelled bookings' },
        { status: 400 }
      )
    }

    // Get service price
    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const totalPrice = toNumber(service.price) * parseInt(quantity)

    const roomService = await prisma.roomServiceLog.create({
      data: {
        bookingId: parseInt(bookingId),
        serviceId: parseInt(serviceId),
        quantity: parseInt(quantity),
        totalPrice,
      },
      include: {
        service: true
      }
    })

    return NextResponse.json(roomService, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add service' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

