import Layout from '@/components/Layout'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { toNumber } from '@/lib/utils'

async function getRooms() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  
  if (!session) {
    redirect('/login')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rooms`, {
    cache: 'no-store',
    headers: {
      Cookie: `session=${session.value}`,
    },
  })

  if (!res.ok) {
    return []
  }

  return res.json()
}

export default async function RoomsPage() {
  const rooms = await getRooms()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant_clean':
        return 'bg-green-100 text-green-800 border border-green-300'
      case 'vacant_dirty':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'reserved':
        return 'bg-purple-100 text-purple-800 border border-purple-300'
      case 'out_of_service':
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
            <h1 className="text-4xl font-bold text-[#283618] mb-2">Rooms</h1>
            <p className="text-[#606c38]">Manage your hotel rooms and availability</p>
          </div>
          <Link href="/rooms/new" className="btn-primary">
            + Add Room
          </Link>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-[#606c38] bg-[#fefae0]">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Room Number</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Price/Night</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rooms.map((room: any) => (
                <tr key={room.id} className="hover:bg-[#fefae0] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-[#283618]">{room.roomNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#606c38]">{room.roomType}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-[#283618]">
                      ${toNumber(room.pricePerNight).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(room.status)}`}>
                      {room.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/rooms/${room.id}`}
                      className="text-[#606c38] hover:text-[#dda15e] font-medium text-sm transition-colors"
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
    </Layout>
  )
}

