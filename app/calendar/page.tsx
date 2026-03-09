'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface Booking {
  id: number
  guestName: string
  checkIn: string
  checkOut: string
  status: string
  room: {
    roomNumber: string
  }
  totalAmount: any
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [currentDate])

  const fetchBookings = async () => {
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const res = await fetch(
        `/api/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getBookingsForDate = (date: Date | null) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter((booking) => {
      const checkIn = new Date(booking.checkIn).toISOString().split('T')[0]
      const checkOut = new Date(booking.checkOut).toISOString().split('T')[0]
      return dateStr >= checkIn && dateStr < checkOut
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-500'
      case 'checked_in':
        return 'bg-green-500'
      case 'completed':
        return 'bg-gray-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

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
            <h1 className="text-3xl font-bold text-[#283618]">Booking Calendar</h1>
            <p className="text-[#606c38] mt-1">View all bookings in calendar format</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-secondary"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#283618]">{monthName}</h2>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-bold text-[#283618] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              const dayBookings = getBookingsForDate(date)
              const isToday =
                date &&
                date.toDateString() === new Date().toDateString()
              const isCurrentMonth = date !== null

              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] border-2 rounded-lg p-2
                    ${isToday ? 'border-[#606c38] bg-[#fefae0]' : 'border-[#dda15e]'}
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                  `}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          isToday ? 'text-[#606c38]' : 'text-[#283618]'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((booking) => (
                          <Link
                            key={booking.id}
                            href={`/bookings/${booking.id}`}
                            className={`
                              block text-xs p-1 rounded truncate text-white
                              ${getStatusColor(booking.status)}
                              hover:opacity-80 transition-opacity
                            `}
                            title={`${booking.guestName} - Room ${booking.room.roomNumber}`}
                          >
                            {booking.room.roomNumber}: {booking.guestName}
                          </Link>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-xs text-[#606c38] font-semibold">
                            +{dayBookings.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="card">
          <h3 className="text-lg font-bold text-[#283618] mb-4">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-[#283618]">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-[#283618]">Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm text-[#283618]">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-[#283618]">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

