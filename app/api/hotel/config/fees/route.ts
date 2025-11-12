import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHotelRole } from '@/lib/guards'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { hotelId } = await requireHotelRole(request, ['admin', 'manager', 'employee', 'viewer'])
    
    const fees = await prisma.fee.findMany({
      where: { hotelId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(fees)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fees' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, hotelId } = await requireHotelRole(request, ['admin', 'manager'])
    
    const body = await request.json()
    const { name, amount, perNight } = body

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fee = await prisma.fee.create({
      data: {
        hotelId,
        name,
        amount: parseFloat(amount),
        perNight: perNight === true,
      },
    })

    await logAudit({
      hotelId,
      userId,
      action: 'create',
      entity: 'Fee',
      entityId: fee.id,
      diff: { name, amount, perNight },
    })

    return NextResponse.json(fee, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Fee with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create fee' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

