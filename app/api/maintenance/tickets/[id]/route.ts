import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticketId = parseInt(params.id)
    const { status, assigneeId, priority, description } = await request.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId ? parseInt(assigneeId) : null
    if (priority) updateData.priority = priority
    if (description !== undefined) updateData.description = description

    const ticket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: updateData,
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
    console.error('Ticket update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticketId = parseInt(params.id)

    await prisma.maintenanceTicket.delete({
      where: { id: ticketId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ticket deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

