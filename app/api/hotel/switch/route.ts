import { NextRequest, NextResponse } from 'next/server'
import { requireHotelAccess } from '@/lib/guards'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const { userId, hotelId } = await requireHotelAccess(request)
    const body = await request.json()
    const { hotelId: newHotelId } = body

    if (!newHotelId) {
      return NextResponse.json(
        { error: 'hotelId is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this hotel
    const { prisma } = await import('@/lib/prisma')
    const membership = await prisma.hotelMember.findUnique({
      where: {
        userId_hotelId: {
          userId,
          hotelId: newHotelId
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this hotel' },
        { status: 403 }
      )
    }

    const response = NextResponse.json({ success: true, hotelId: newHotelId })
    response.cookies.set('activeHotelId', newHotelId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    await logAudit({
      hotelId: newHotelId,
      userId,
      action: 'hotel_switch',
      entity: 'Hotel',
      entityId: newHotelId,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to switch hotel' },
      { status: error.message === 'Unauthorized' || error.message === 'Not a member of this hotel' ? 401 : 500 }
    )
  }
}

