import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHotelRole } from '@/lib/guards'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { hotelId } = await requireHotelRole(request, ['admin', 'manager', 'employee', 'viewer'])
    
    const seasons = await prisma.season.findMany({
      where: { hotelId },
      orderBy: { startDate: 'asc' }
    })

    return NextResponse.json(seasons)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch seasons' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, hotelId } = await requireHotelRole(request, ['admin', 'manager'])
    
    const body = await request.json()
    const { name, startDate, endDate, rateDelta, percentDelta } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rateDelta === undefined && percentDelta === undefined) {
      return NextResponse.json(
        { error: 'Either rateDelta or percentDelta is required' },
        { status: 400 }
      )
    }

    const season = await prisma.season.create({
      data: {
        hotelId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rateDelta: rateDelta !== undefined ? parseFloat(rateDelta) : 0,
        percentDelta: percentDelta !== undefined ? parseInt(percentDelta) : null,
      },
    })

    await logAudit({
      hotelId,
      userId,
      action: 'create',
      entity: 'Season',
      entityId: season.id,
      diff: { name, startDate, endDate, rateDelta, percentDelta },
    })

    return NextResponse.json(season, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create season' },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 401 : 500 }
    )
  }
}

