import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const hotelId = parseInt(request.cookies.get('activeHotelId')?.value || '1')

    const where: any = { hotelId }
    if (status && status !== 'all') {
      where.status = status
    }
    if (priority && priority !== 'all') {
      where.priority = priority
    }

    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Tickets fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, title, description, priority, assigneeId } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const hotelId = parseInt(request.cookies.get('activeHotelId')?.value || '1')

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        hotelId,
        roomId: roomId ? parseInt(roomId) : null,
        title,
        description: description || null,
        priority: priority || 'medium',
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        status: 'open',
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Ticket creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

