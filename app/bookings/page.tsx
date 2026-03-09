import Layout from '@/components/Layout'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { toNumber } from '@/lib/utils'

async function getBookings() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  
  if (!session) {
    redirect('/login')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bookings`, {
    cache: 'no-store',
    headers: {
      Cookie: `session=${session.value}`,
    },
  })

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  // Handle both old format (array) and new format ({ bookings })
  return Array.isArray(data) ? data : (data.bookings || [])
}

export default async function BookingsPage() {
  const bookings = await getBookings()
  
  // Ensure bookings is always an array
  const bookingsArray = Array.isArray(bookings) ? bookings : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'checked_in':
        return 'bg-green-100 text-green-800 border border-green-300'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#283618] mb-2">Bookings</h1>
            <p className="text-[#606c38]">Manage guest reservations and check-ins</p>
          </div>
          <Link href="/bookings/new" className="btn-primary">
            + New Booking
          </Link>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-[#606c38] bg-[#fefae0]">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Guest</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Check-in</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Check-out</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookingsArray.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#606c38]">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookingsArray.map((booking: any) => (
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
                    <span className="text-sm font-bold text-[#283618]">
                      ${toNumber(booking.totalAmount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-[#606c38] hover:text-[#dda15e] font-medium text-sm transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

