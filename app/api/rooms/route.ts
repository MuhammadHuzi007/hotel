import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const hotelId = parseInt(searchParams.get('hotelId') || '1') // MVP: single hotel

    const where: any = { hotelId }
    if (status) {
      where.status = status
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        hotel: {
          select: { name: true }
        }
      },
      orderBy: { roomNumber: 'asc' }
    })

    return NextResponse.json(rooms)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rooms' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request, ['admin'])
    
    const body = await request.json()
    const { roomNumber, roomType, pricePerNight, status, hotelId = 1 } = body

    if (!roomNumber || !roomType || !pricePerNight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        hotelId,
        roomNumber,
        roomType,
        pricePerNight: parseFloat(pricePerNight),
        status: status || 'vacant_clean',
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Room number already exists for this hotel' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

