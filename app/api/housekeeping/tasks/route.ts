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
    const hotelId = parseInt(request.cookies.get('activeHotelId')?.value || '1')

    const where: any = { hotelId }
    if (status && status !== 'all') {
      where.status = status
    }

    const tasks = await prisma.housekeepingTask.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Tasks fetch error:', error)
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

    const { roomId, title, assigneeId, dueDate, notes } = await request.json()

    if (!roomId || !title) {
      return NextResponse.json(
        { error: 'Room ID and title are required' },
        { status: 400 }
      )
    }

    const hotelId = parseInt(request.cookies.get('activeHotelId')?.value || '1')

    const task = await prisma.housekeepingTask.create({
      data: {
        hotelId,
        roomId: parseInt(roomId),
        title,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        status: 'todo',
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

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

