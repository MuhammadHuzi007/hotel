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

    const taskId = parseInt(params.id)
    const { status, assigneeId, notes, dueDate } = await request.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId ? parseInt(assigneeId) : null
    if (notes !== undefined) updateData.notes = notes
    if (dueDate) updateData.dueDate = new Date(dueDate)

    const task = await prisma.housekeepingTask.update({
      where: { id: taskId },
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

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Task update error:', error)
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

    const taskId = parseInt(params.id)

    await prisma.housekeepingTask.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

