import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHotelRole } from '@/lib/guards'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { hotelId } = await requireHotelRole(request, ['admin', 'manager', 'employee', 'viewer'])
    
    const taxes = await prisma.tax.findMany({
      where: { hotelId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(taxes)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch taxes' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, hotelId } = await requireHotelRole(request, ['admin', 'manager'])
    
    const body = await request.json()
    const { name, percent } = body

    if (!name || percent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tax = await prisma.tax.create({
      data: {
        hotelId,
        name,
        percent: parseFloat(percent),
      },
    })

    await logAudit({
      hotelId,
      userId,
      action: 'create',
      entity: 'Tax',
      entityId: tax.id,
      diff: { name, percent },
    })

    return NextResponse.json(tax, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tax with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create tax' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

