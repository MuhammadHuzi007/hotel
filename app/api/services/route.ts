import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const { searchParams } = new URL(request.url)
    const hotelId = parseInt(searchParams.get('hotelId') || '1')

    const services = await prisma.service.findMany({
      where: { hotelId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(services)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch services' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request, ['admin'])
    
    const body = await request.json()
    const { name, price, hotelId = 1 } = body

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        hotelId,
        name,
        price: parseFloat(price),
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create service' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

