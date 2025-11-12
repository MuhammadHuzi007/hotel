import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        room: true,
        hotel: true,
        user: {
          select: { username: true, email: true }
        },
        payments: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const body = await request.json()
    const { status, guestName, guestEmail, guestPhone, checkIn, checkOut } = body

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(params.id) },
      include: { room: true }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Handle status transitions
    if (status) {
      return await handleStatusTransition(parseInt(params.id), status, booking)
    }

    // Update other fields
    const updateData: any = {}
    if (guestName !== undefined) updateData.guestName = guestName
    if (guestEmail !== undefined) updateData.guestEmail = guestEmail
    if (guestPhone !== undefined) updateData.guestPhone = guestPhone
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn)
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut)

    const updated = await prisma.booking.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update booking' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

async function handleStatusTransition(
  bookingId: number,
  newStatus: string,
  booking: any
) {
  return await prisma.$transaction(async (tx) => {
    if (newStatus === 'checked_in') {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'checked_in' },
      })
      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: 'occupied' },
      })
      return updated
    }

    if (newStatus === 'completed') {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'completed',
          actualCheckOut: new Date(),
        },
      })
      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: 'vacant_dirty' },
      })
      return updated
    }

    if (newStatus === 'cancelled') {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' },
      })
      // Return room to vacant_clean if it was reserved
      if (booking.room.status === 'reserved') {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: 'vacant_clean' },
        })
      }
      return updated
    }

    // Default: just update status
    return await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    })
  })
}

