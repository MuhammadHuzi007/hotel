import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHotelRole } from '@/lib/guards'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { hotelId } = await requireHotelRole(request, ['admin', 'manager', 'employee', 'viewer'])
    
    const ratePlans = await prisma.ratePlan.findMany({
      where: { hotelId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(ratePlans)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rate plans' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, hotelId } = await requireHotelRole(request, ['admin', 'manager'])
    
    const body = await request.json()
    const { name, refundable, minAdvanceDays, weekendSurcharge } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const ratePlan = await prisma.ratePlan.create({
      data: {
        hotelId,
        name,
        refundable: refundable !== false,
        minAdvanceDays: minAdvanceDays ? parseInt(minAdvanceDays) : 0,
        weekendSurcharge: weekendSurcharge ? parseFloat(weekendSurcharge) : null,
      },
    })

    await logAudit({
      hotelId,
      userId,
      action: 'create',
      entity: 'RatePlan',
      entityId: ratePlan.id,
      diff: { name, refundable, minAdvanceDays, weekendSurcharge },
    })

    return NextResponse.json(ratePlan, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Rate plan with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create rate plan' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

