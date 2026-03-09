import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { toNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const hotelId = parseInt(searchParams.get('hotelId') || '1')

    const where: any = { hotelId }
    if (status) {
      where.status = status
    }
    if (startDate || endDate) {
      where.OR = [
        {
          AND: [
            { checkIn: { lte: endDate ? new Date(endDate) : undefined } },
            { checkOut: { gte: startDate ? new Date(startDate) : undefined } },
          ],
        },
      ]
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          select: { roomNumber: true, roomType: true }
        },
        user: {
          select: { username: true, email: true }
        },
        payments: true,
        services: {
          include: {
            service: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { checkIn: 'desc' }
    })

    return NextResponse.json({ bookings })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const body = await request.json()
    const {
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      hotelId = 1,
      userId,
    } = body

    if (!roomId || !guestName || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify room is available
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.status !== 'vacant_clean') {
      return NextResponse.json(
        { error: 'Room is not available' },
        { status: 400 }
      )
    }

    // Check for overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId: parseInt(roomId),
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
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'Room is already booked for these dates' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const nightlyTotal = toNumber(room.pricePerNight) * nights
    const taxTotal = 0 // No taxes applied for internal bookings
    const feeTotal = 0 // No fees applied for internal bookings
    const serviceTotal = 0 // No services initially
    const grandTotal = nightlyTotal + taxTotal + feeTotal + serviceTotal
    const totalAmount = grandTotal // Legacy field

    // Create booking in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId: userId ? parseInt(userId) : null,
          hotelId,
          roomId: parseInt(roomId),
          guestName,
          guestEmail,
          guestPhone,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nightlyTotal,
          taxTotal,
          feeTotal,
          serviceTotal,
          grandTotal,
          totalAmount,
          status: 'booked',
        },
      })

      // Optionally set room to reserved
      await tx.room.update({
        where: { id: parseInt(roomId) },
        data: { status: 'reserved' },
      })

      return newBooking
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

