import Layout from '@/components/Layout'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/utils'
import Link from 'next/link'
import DashboardCharts from '@/components/DashboardCharts'

async function getDashboardData() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  
  if (!session) {
    redirect('/login')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const hotelId = 1 // MVP: single hotel

  const [rooms, allBookings, checkedInBookings, recentBookings, payments, services] = await Promise.all([
    prisma.room.findMany({
      where: { hotelId },
      orderBy: { roomNumber: 'asc' }
    }),
    prisma.booking.findMany({
      where: { hotelId },
      include: {
        room: {
          select: { roomNumber: true, roomType: true }
        },
        payments: true,
        services: {
          include: {
            service: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { checkIn: 'desc' }
    }),
    prisma.booking.findMany({
      where: {
        hotelId,
        status: 'checked_in',
      },
      include: {
        room: {
          select: { roomNumber: true, roomType: true }
        }
      }
    }),
    prisma.booking.findMany({
      where: {
        hotelId,
        checkIn: { gte: thirtyDaysAgo },
      },
      include: {
        payments: true,
        services: true,
      },
      orderBy: { checkIn: 'asc' }
    }),
    prisma.payment.findMany({
      where: {
        booking: { hotelId },
        paymentDate: { gte: thirtyDaysAgo },
      },
      include: {
        booking: {
          select: { checkIn: true }
        }
      },
      orderBy: { paymentDate: 'asc' }
    }),
    prisma.service.findMany({
      where: { hotelId },
    })
  ])

  // Calculate occupancy
  const totalRooms = rooms.length
  const occupiedRooms = checkedInBookings.length
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

  // Get today's check-ins and check-outs
  const todayCheckIns = allBookings.filter((b) => {
    const checkIn = new Date(b.checkIn)
    checkIn.setHours(0, 0, 0, 0)
    return checkIn.getTime() === today.getTime() && b.status === 'booked'
  })

  const todayCheckOuts = allBookings.filter((b) => {
    const checkOut = new Date(b.checkOut)
    checkOut.setHours(0, 0, 0, 0)
    return checkOut.getTime() === today.getTime() && b.status === 'checked_in'
  })

  // Room status counts
  const statusCounts: Record<string, number> = {}
  rooms.forEach((room) => {
    statusCounts[room.status] = (statusCounts[room.status] || 0) + 1
  })

  // Revenue by day (last 30 days)
  const revenueByDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    revenueByDay[dateStr] = 0
  }

  recentBookings.forEach((booking) => {
    const checkInStr = new Date(booking.checkIn).toISOString().split('T')[0]
    if (revenueByDay[checkInStr] !== undefined) {
      revenueByDay[checkInStr] += toNumber(booking.grandTotal || booking.totalAmount)
    }
  })

  // Booking status distribution
  const bookingStatusCounts: Record<string, number> = {}
  allBookings.forEach((booking) => {
    bookingStatusCounts[booking.status] = (bookingStatusCounts[booking.status] || 0) + 1
  })

  // Revenue by service
  const revenueByService: Record<string, number> = {}
  allBookings.forEach((booking) => {
    booking.services.forEach((serviceLog: any) => {
      const serviceName = serviceLog.service?.name || 'Unknown'
      revenueByService[serviceName] = (revenueByService[serviceName] || 0) + toNumber(serviceLog.totalPrice)
    })
  })

  // Daily occupancy (last 7 days)
  const occupancyByDay: Array<{ date: string; occupancy: number }> = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const bookingsOnDate = allBookings.filter((b) => {
      const checkIn = new Date(b.checkIn).toISOString().split('T')[0]
      const checkOut = new Date(b.checkOut).toISOString().split('T')[0]
      return dateStr >= checkIn && dateStr < checkOut && (b.status === 'checked_in' || b.status === 'booked')
    })
    
    occupancyByDay.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      occupancy: totalRooms > 0 ? (bookingsOnDate.length / totalRooms) * 100 : 0
    })
  }

  const reports = {
    occupancyRate,
    roomStatusCounts: statusCounts,
    revenueByDay: Object.entries(revenueByDay)
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(revenue.toFixed(2))
      }))
      .reverse()
      .slice(0, 30),
    bookingStatusCounts,
    revenueByService: Object.entries(revenueByService).map(([name, revenue]) => ({
      name,
      revenue: Number(revenue.toFixed(2))
    })),
    occupancyByDay,
  }

  return { rooms, bookings: allBookings, reports, todayCheckIns, todayCheckOuts }
}

export default async function DashboardPage() {
  const { rooms, bookings, reports, todayCheckIns, todayCheckOuts } = await getDashboardData()

  const statusCounts = reports.roomStatusCounts

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#283618] mb-2">Dashboard</h1>
          <p className="text-[#606c38]">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Today's Operations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-[#606c38] to-[#4a5530] text-[#fefae0]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Today's Check-ins</h2>
              <span className="text-3xl">📥</span>
            </div>
            <p className="text-4xl font-bold">{todayCheckIns.length}</p>
            <p className="text-sm mt-2 opacity-90">Guests arriving today</p>
          </div>
          <div className="card bg-gradient-to-br from-[#dda15e] to-[#bc6c25] text-[#fefae0]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Today's Check-outs</h2>
              <span className="text-3xl">📤</span>
            </div>
            <p className="text-4xl font-bold">{todayCheckOuts.length}</p>
            <p className="text-sm mt-2 opacity-90">Guests departing today</p>
          </div>
          <div className="card bg-gradient-to-br from-[#283618] to-[#1a2410] text-[#fefae0]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Occupancy Rate</h2>
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-4xl font-bold">
              {reports?.occupancyRate?.toFixed(1) || 0}%
            </p>
            <p className="text-sm mt-2 opacity-90">Current occupancy</p>
          </div>
        </div>

        {/* Rooms by Status */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Rooms by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const statusColors: Record<string, string> = {
                vacant_clean: 'bg-green-100 text-green-800 border-green-300',
                vacant_dirty: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                occupied: 'bg-blue-100 text-blue-800 border-blue-300',
                reserved: 'bg-purple-100 text-purple-800 border-purple-300',
                out_of_service: 'bg-red-100 text-red-800 border-red-300',
              }
              return (
                <div
                  key={status}
                  className={`text-center p-4 rounded-lg border-2 ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                >
                  <div className="text-3xl font-bold mb-1">{count}</div>
                  <div className="text-sm font-medium capitalize">
                    {status.replace('_', ' ')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Charts Section */}
        <DashboardCharts reports={reports} />

        {/* Today's Check-ins List */}
        {todayCheckIns.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#283618]">Upcoming Check-ins Today</h2>
              <Link href="/bookings" className="btn-secondary text-sm">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#606c38]">
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Check-in</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Check-out</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayCheckIns.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-[#fefae0] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#283618]">{booking.guestName}</div>
                        {booking.guestEmail && (
                          <div className="text-xs text-[#606c38]">{booking.guestEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge bg-[#606c38] text-[#fefae0]">
                          {booking.room.roomNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-[#606c38] hover:text-[#dda15e] font-medium text-sm"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Today's Check-outs List */}
        {todayCheckOuts.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#283618]">Pending Check-outs Today</h2>
              <Link href="/bookings" className="btn-secondary text-sm">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#606c38]">
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Check-out</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayCheckOuts.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-[#fefae0] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#283618]">{booking.guestName}</div>
                        {booking.guestEmail && (
                          <div className="text-xs text-[#606c38]">{booking.guestEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge bg-[#dda15e] text-[#283618]">
                          {booking.room.roomNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#283618]">
                          ${toNumber(booking.totalAmount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="btn-primary text-sm py-1 px-3"
                        >
                          Process
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

