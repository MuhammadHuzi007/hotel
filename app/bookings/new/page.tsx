'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { toNumber } from '@/lib/utils'

export default function NewBookingPage() {
  const router = useRouter()
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    roomId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  })

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(console.error)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.checkIn || !formData.checkOut) {
      alert('Please select check-in and check-out dates')
      return
    }

    setSearching(true)
    try {
      const res = await fetch(
        `/api/availability?checkIn=${formData.checkIn}&checkOut=${formData.checkOut}`
      )
      const data = await res.json()
      setAvailableRooms(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.roomId || !formData.guestName || !formData.checkIn || !formData.checkOut) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const booking = await res.json()
        router.push(`/bookings/${booking.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Booking creation failed:', error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#283618] mb-2">New Booking</h1>
          <p className="text-[#606c38]">Search for available rooms and create a new reservation</p>
        </div>

        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Search Availability</h2>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Check-in</label>
              <input
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Check-out</label>
              <input
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searching}
                className="btn-primary w-full disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {availableRooms.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-[#283618] mb-6">Available Rooms</h2>
            <div className="space-y-3">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.roomId === room.id.toString()
                      ? 'border-[#606c38] bg-[#fefae0] shadow-md'
                      : 'border-gray-200 hover:border-[#dda15e] hover:bg-gray-50'
                  }`}
                  onClick={() => setFormData({ ...formData, roomId: room.id.toString() })}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#283618] text-lg">Room {room.roomNumber}</span>
                      <span className="text-[#606c38] ml-2">({room.roomType})</span>
                    </div>
                    <span className="font-bold text-[#283618] text-lg">
                      ${toNumber(room.pricePerNight).toFixed(2)}/night
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Guest Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Guest Name *</label>
              <input
                type="text"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Email</label>
              <input
                type="email"
                value={formData.guestEmail}
                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Phone</label>
              <input
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading || !formData.roomId}
              className="btn-primary px-8 py-3 text-base disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

