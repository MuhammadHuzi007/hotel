import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHotelRole } from '@/lib/guards'
import { logAudit } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, hotelId } = await requireHotelRole(request, ['admin', 'manager'])
    
    const body = await request.json()
    const { name, startDate, endDate, rateDelta, percentDelta } = body

    const season = await prisma.season.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!season || season.hotelId !== hotelId) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (rateDelta !== undefined) updateData.rateDelta = parseFloat(rateDelta)
    if (percentDelta !== undefined) updateData.percentDelta = percentDelta ? parseInt(percentDelta) : null

    const updated = await prisma.season.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    await logAudit({
      hotelId,
      userId,
      action: 'update',
      entity: 'Season',
      entityId: updated.id,
      diff: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update season' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, hotelId } = await requireHotelRole(request, ['admin', 'manager'])
    
    const season = await prisma.season.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!season || season.hotelId !== hotelId) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      )
    }

    await prisma.season.delete({
      where: { id: parseInt(params.id) },
    })

    await logAudit({
      hotelId,
      userId,
      action: 'delete',
      entity: 'Season',
      entityId: season.id,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete season' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

