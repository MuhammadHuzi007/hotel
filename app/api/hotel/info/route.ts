import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, address, city, phone } = await request.json()

    if (!name || !address || !city || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Get active hotel from cookie
    const activeHotelId = request.cookies.get('activeHotelId')?.value
    if (!activeHotelId) {
      return NextResponse.json(
        { error: 'No active hotel selected' },
        { status: 400 }
      )
    }

    // Check if user has access to this hotel
    const membership = await prisma.hotelMember.findFirst({
      where: {
        userId: session.userId,
        hotelId: parseInt(activeHotelId),
        role: { in: ['admin', 'manager'] },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to update this hotel' },
        { status: 403 }
      )
    }

    const hotel = await prisma.hotel.update({
      where: { id: parseInt(activeHotelId) },
      data: { name, address, city, phone },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
      },
    })

    return NextResponse.json({ hotel })
  } catch (error) {
    console.error('Hotel update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

