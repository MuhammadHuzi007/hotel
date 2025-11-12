import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const room = await prisma.room.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        hotel: true,
        bookings: {
          where: {
            status: { in: ['booked', 'checked_in'] }
          },
          orderBy: { checkIn: 'asc' }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch room' },
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
    const { roomNumber, roomType, pricePerNight, status } = body

    const updateData: any = {}
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber
    if (roomType !== undefined) updateData.roomType = roomType
    if (pricePerNight !== undefined) updateData.pricePerNight = parseFloat(pricePerNight)
    if (status !== undefined) updateData.status = status

    const room = await prisma.room.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    return NextResponse.json(room)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update room' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request, ['admin'])
    
    await prisma.room.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete room' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

