import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const hotelId = parseInt(request.cookies.get('activeHotelId')?.value || '1')

    // Get notifications based on hotel activities
    const where: any = { hotelId }

    // Get today's check-ins
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [checkIns, checkOuts, maintenanceTickets, tasks] = await Promise.all([
      prisma.booking.findMany({
        where: {
          hotelId,
          checkIn: { gte: today, lt: tomorrow },
          status: 'booked',
        },
        include: { room: { select: { roomNumber: true } } },
      }),
      prisma.booking.findMany({
        where: {
          hotelId,
          checkOut: { gte: today, lt: tomorrow },
          status: 'checked_in',
        },
        include: { room: { select: { roomNumber: true } } },
      }),
      prisma.maintenanceTicket.findMany({
        where: {
          hotelId,
          status: { in: ['open', 'in_progress'] },
          priority: { in: ['high', 'urgent'] },
        },
        take: 5,
      }),
      prisma.housekeepingTask.findMany({
        where: {
          hotelId,
          status: { in: ['todo', 'in_progress'] },
          dueDate: { lte: tomorrow },
        },
        include: { room: { select: { roomNumber: true } } },
        take: 5,
      }),
    ])

    // Build notifications array
    const notifications: any[] = []

    checkIns.forEach((booking) => {
      notifications.push({
        id: `checkin-${booking.id}`,
        type: 'checkin',
        title: 'Check-in Today',
        message: `${booking.guestName} - Room ${booking.room.roomNumber}`,
        read: false,
        createdAt: booking.checkIn.toISOString(),
        link: `/bookings/${booking.id}`,
      })
    })

    checkOuts.forEach((booking) => {
      notifications.push({
        id: `checkout-${booking.id}`,
        type: 'checkout',
        title: 'Check-out Today',
        message: `${booking.guestName} - Room ${booking.room.roomNumber}`,
        read: false,
        createdAt: booking.checkOut.toISOString(),
        link: `/bookings/${booking.id}`,
      })
    })

    maintenanceTickets.forEach((ticket) => {
      notifications.push({
        id: `maintenance-${ticket.id}`,
        type: 'maintenance',
        title: `${ticket.priority.toUpperCase()} Maintenance Issue`,
        message: ticket.title,
        read: false,
        createdAt: ticket.createdAt.toISOString(),
        link: `/maintenance`,
      })
    })

    tasks.forEach((task) => {
      notifications.push({
        id: `task-${task.id}`,
        type: 'task',
        title: 'Housekeeping Task Due',
        message: `${task.title} - Room ${task.room.roomNumber}`,
        read: false,
        createdAt: task.dueDate?.toISOString() || task.createdAt.toISOString(),
        link: `/housekeeping`,
      })
    })

    // Sort by date (newest first)
    notifications.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Apply filter
    let filteredNotifications = notifications
    if (filter === 'unread') {
      filteredNotifications = notifications.filter((n) => !n.read)
    } else if (filter === 'read') {
      filteredNotifications = notifications.filter((n) => n.read)
    }

    return NextResponse.json({ notifications: filteredNotifications })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

