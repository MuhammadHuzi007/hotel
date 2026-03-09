import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active hotel from cookie
    const activeHotelId = request.cookies.get('activeHotelId')?.value
    let hotel = null

    if (activeHotelId) {
      hotel = await prisma.hotel.findUnique({
        where: { id: parseInt(activeHotelId) },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          phone: true,
        },
      })
    } else {
      // Get first hotel membership
      const membership = await prisma.hotelMember.findFirst({
        where: { userId: session.userId },
        include: { hotel: true },
      })
      if (membership) {
        hotel = {
          id: membership.hotel.id,
          name: membership.hotel.name,
          address: membership.hotel.address,
          city: membership.hotel.city,
          phone: membership.hotel.phone,
        }
      }
    }

    return NextResponse.json({ user, hotel })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, email } = await request.json()

    if (!username || !email) {
      return NextResponse.json(
        { error: 'Username and email are required' },
        { status: 400 }
      )
    }

    // Check if username or email already exists (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: session.userId } },
          {
            OR: [{ username }, { email }],
          },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { username, email },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

