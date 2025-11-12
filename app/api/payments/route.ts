import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const body = await request.json()
    const { bookingId, amount, method } = body

    if (!bookingId || !amount || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        payments: true,
        services: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: parseInt(bookingId),
        amount: parseFloat(amount),
        method,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

