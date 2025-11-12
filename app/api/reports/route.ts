import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { toNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request, ['admin', 'employee'])
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const hotelId = parseInt(searchParams.get('hotelId') || '1')

    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date()

    // Get total rooms
    const totalRooms = await prisma.room.count({
      where: { hotelId }
    })

    // Get occupied rooms (checked_in bookings)
    const occupiedRooms = await prisma.booking.count({
      where: {
        hotelId,
        status: 'checked_in',
        checkIn: { lte: end },
        checkOut: { gte: start },
      }
    })

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    // Get revenue
    const revenueData = await prisma.booking.findMany({
      where: {
        hotelId,
        status: { in: ['completed', 'checked_in'] },
        checkIn: { gte: start, lte: end },
      },
      include: {
        payments: true,
        services: true
      }
    })

    let totalRevenue = 0
    revenueData.forEach(booking => {
      // Room charges
      totalRevenue += toNumber(booking.totalAmount)
      // Service charges
      booking.services.forEach(service => {
        totalRevenue += toNumber(service.totalPrice)
      })
    })

    // Get cancellations
    const cancellations = await prisma.booking.count({
      where: {
        hotelId,
        status: 'cancelled',
        checkIn: { gte: start, lte: end },
      }
    })

    // Revenue by day
    const revenueByDay: Record<string, number> = {}
    revenueData.forEach(booking => {
      const date = booking.checkIn.toISOString().split('T')[0]
      if (!revenueByDay[date]) {
        revenueByDay[date] = 0
      }
      revenueByDay[date] += toNumber(booking.totalAmount)
      booking.services.forEach(service => {
        revenueByDay[date] += toNumber(service.totalPrice)
      })
    })

    // Today's check-ins and check-outs
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCheckIns = await prisma.booking.count({
      where: {
        hotelId,
        status: { in: ['booked', 'checked_in'] },
        checkIn: { gte: today, lt: tomorrow },
      }
    })

    const todayCheckOuts = await prisma.booking.count({
      where: {
        hotelId,
        status: { in: ['checked_in', 'completed'] },
        checkOut: { gte: today, lt: tomorrow },
      }
    })

    // Room status counts
    const roomStatusCounts = await prisma.room.groupBy({
      by: ['status'],
      where: { hotelId },
      _count: true
    })

    const statusCounts: Record<string, number> = {}
    roomStatusCounts.forEach(item => {
      statusCounts[item.status] = item._count
    })

    return NextResponse.json({
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      cancellations,
      revenueByDay,
      todayCheckIns,
      todayCheckOuts,
      roomStatusCounts: statusCounts,
      totalRooms,
      occupiedRooms,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate reports' },
      { status: error.message === 'Unauthorized' || error.message === 'Forbidden' ? 401 : 500 }
    )
  }
}

