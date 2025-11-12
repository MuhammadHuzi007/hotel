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
    const { name, refundable, minAdvanceDays, weekendSurcharge } = body

    const ratePlan = await prisma.ratePlan.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!ratePlan || ratePlan.hotelId !== hotelId) {
      return NextResponse.json(
        { error: 'Rate plan not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (refundable !== undefined) updateData.refundable = refundable
    if (minAdvanceDays !== undefined) updateData.minAdvanceDays = parseInt(minAdvanceDays)
    if (weekendSurcharge !== undefined) updateData.weekendSurcharge = weekendSurcharge ? parseFloat(weekendSurcharge) : null

    const updated = await prisma.ratePlan.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    })

    await logAudit({
      hotelId,
      userId,
      action: 'update',
      entity: 'RatePlan',
      entityId: updated.id,
      diff: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update rate plan' },
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
    
    const ratePlan = await prisma.ratePlan.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!ratePlan || ratePlan.hotelId !== hotelId) {
      return NextResponse.json(
        { error: 'Rate plan not found' },
        { status: 404 }
      )
    }

    await prisma.ratePlan.delete({
      where: { id: parseInt(params.id) },
    })

    await logAudit({
      hotelId,
      userId,
      action: 'delete',
      entity: 'RatePlan',
      entityId: ratePlan.id,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete rate plan' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

