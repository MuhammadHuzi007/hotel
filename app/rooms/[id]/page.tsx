'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { toNumber } from '@/lib/utils'

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch(`/api/rooms/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setRoom(data)
        setStatus(data.status)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const handleStatusUpdate = async () => {
    if (status === room.status) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/rooms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const updated = await res.json()
        setRoom(updated)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <p className="text-[#283618]">Loading...</p>
        </div>
      </Layout>
    )
  }

  if (!room) {
    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <p className="text-[#283618]">Room not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#283618] mb-2">Room {room.roomNumber}</h1>
          <p className="text-[#606c38]">Room details and management</p>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Room Type</label>
              <p className="text-[#283618] font-medium">{room.roomType}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Price per Night</label>
              <p className="text-[#283618] font-bold text-lg">${toNumber(room.pricePerNight).toFixed(2)}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#283618] mb-2">Status</label>
              <div className="flex items-center gap-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="vacant_clean">Vacant Clean</option>
                  <option value="vacant_dirty">Vacant Dirty</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
                {status !== room.status && (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating}
                    className="btn-primary disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {room.bookings && room.bookings.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-[#283618] mb-6">Active Bookings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#606c38] bg-[#fefae0]">
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Check-in</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Check-out</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {room.bookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-[#fefae0] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#283618]">{booking.guestName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge bg-[#606c38] text-[#fefae0]">
                          {booking.status.replace('_', ' ')}
                        </span>
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

