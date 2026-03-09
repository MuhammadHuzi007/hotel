'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface Guest {
  guestName: string
  guestEmail?: string | null
  guestPhone?: string | null
  totalBookings: number
  totalSpent: number
  lastVisit?: string
  bookings: Array<{
    id: number
    checkIn: string
    checkOut: string
    status: string
    totalAmount: any
    room: {
      roomNumber: string
    }
  }>
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/guests')
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests || [])
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = guests.filter((guest) => {
    const search = searchTerm.toLowerCase()
    return (
      guest.guestName.toLowerCase().includes(search) ||
      guest.guestEmail?.toLowerCase().includes(search) ||
      guest.guestPhone?.includes(search)
    )
  })

  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#283618]">Current Guests</h1>
            <p className="text-[#606c38] mt-1">Guests currently checked in or with active bookings</p>
          </div>
          <div className="flex gap-2">
            <Link href="/guests/history" className="btn-secondary">
              View History
            </Link>
            <div className="w-64">
              <input
                type="text"
                placeholder="Search guests..."
                className="input-field w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Guest Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-[#606c38] to-[#4a5530] text-[#fefae0]">
            <div className="text-sm opacity-90">Current Guests</div>
            <div className="text-3xl font-bold mt-1">{guests.length}</div>
          </div>
          <div className="card bg-gradient-to-br from-[#dda15e] to-[#bc6c25] text-[#fefae0]">
            <div className="text-sm opacity-90">Total Bookings</div>
            <div className="text-3xl font-bold mt-1">
              {guests.reduce((sum, g) => sum + g.totalBookings, 0)}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-[#283618] to-[#1a2410] text-[#fefae0]">
            <div className="text-sm opacity-90">Total Revenue</div>
            <div className="text-3xl font-bold mt-1">
              ${guests.reduce((sum, g) => sum + g.totalSpent, 0).toFixed(0)}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-[#bc6c25] to-[#a55a1f] text-[#fefae0]">
            <div className="text-sm opacity-90">Avg. per Guest</div>
            <div className="text-3xl font-bold mt-1">
              ${guests.length > 0 ? (guests.reduce((sum, g) => sum + g.totalSpent, 0) / guests.length).toFixed(0) : 0}
            </div>
          </div>
        </div>

        {/* Guests List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-[#606c38]">
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Guest Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGuests.map((guest, index) => {
                  // Get current active booking
                  const currentBooking = guest.bookings.find(
                    (b) => b.status === 'booked' || b.status === 'checked_in'
                  )
                  
                  return (
                    <tr key={index} className="hover:bg-[#fefae0] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#283618]">{guest.guestName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#283618]">
                          {guest.guestEmail && (
                            <div className="text-[#606c38]">{guest.guestEmail}</div>
                          )}
                          {guest.guestPhone && (
                            <div className="text-[#606c38]">{guest.guestPhone}</div>
                          )}
                          {!guest.guestEmail && !guest.guestPhone && (
                            <span className="text-gray-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currentBooking ? (
                          <span className="badge bg-[#606c38] text-[#fefae0]">
                            {currentBooking.room.roomNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {currentBooking
                          ? new Date(currentBooking.checkIn).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {currentBooking
                          ? new Date(currentBooking.checkOut).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currentBooking && (
                          <span className={`badge ${
                            currentBooking.status === 'checked_in'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {currentBooking.status === 'checked_in' ? 'Checked In' : 'Booked'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currentBooking && (
                          <Link
                            href={`/bookings/${currentBooking.id}`}
                            className="text-[#606c38] hover:text-[#dda15e] font-medium text-sm"
                          >
                            View Booking →
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredGuests.length === 0 && (
              <div className="text-center py-8 text-[#606c38]">
                {searchTerm ? 'No guests found matching your search' : 'No guests found'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

