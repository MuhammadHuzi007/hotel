'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface Room {
  id: number
  roomNumber: string
  roomType: string
  pricePerNight: any
  status: string
  bookings?: Array<{
    guestName: string
    checkIn: string
    checkOut: string
  }>
}

export default function RoomGridPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant_clean':
        return 'bg-green-500 hover:bg-green-600'
      case 'vacant_dirty':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'occupied':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'reserved':
        return 'bg-purple-500 hover:bg-purple-600'
      case 'out_of_service':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const filteredRooms = filter === 'all' 
    ? rooms 
    : rooms.filter((room) => room.status === filter)

  const statusCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
            <h1 className="text-3xl font-bold text-[#283618]">Room Status Grid</h1>
            <p className="text-[#606c38] mt-1">Visual overview of all rooms</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('grid')}
              className={`px-4 py-2 rounded-lg ${
                view === 'grid'
                  ? 'bg-[#606c38] text-[#fefae0]'
                  : 'bg-[#fefae0] text-[#283618] hover:bg-[#dda15e]'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg ${
                view === 'list'
                  ? 'bg-[#606c38] text-[#fefae0]'
                  : 'bg-[#fefae0] text-[#283618] hover:bg-[#dda15e]'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              className={`
                card text-center p-4 transition-all
                ${filter === status ? 'ring-2 ring-[#606c38]' : ''}
              `}
            >
              <div className={`w-4 h-4 ${getStatusColor(status)} rounded-full mx-auto mb-2`}></div>
              <div className="text-2xl font-bold text-[#283618]">{count}</div>
              <div className="text-xs text-[#606c38] mt-1">{getStatusLabel(status)}</div>
            </button>
          ))}
        </div>

        {/* Room Grid */}
        {view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredRooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className={`
                  card ${getStatusColor(room.status)} text-white
                  hover:shadow-xl transform hover:scale-105 transition-all duration-200
                  p-4 text-center
                `}
              >
                <div className="text-2xl font-bold mb-1">{room.roomNumber}</div>
                <div className="text-xs opacity-90 mb-2">{room.roomType}</div>
                <div className="text-xs opacity-75">
                  ${typeof room.pricePerNight === 'number' 
                    ? room.pricePerNight.toFixed(2) 
                    : parseFloat(room.pricePerNight).toFixed(2)}/night
                </div>
                <div className="mt-2 text-xs font-semibold uppercase">
                  {getStatusLabel(room.status)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#606c38]">
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-[#fefae0] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-[#283618]">{room.roomNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#606c38]">
                        {room.roomType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        ${typeof room.pricePerNight === 'number' 
                          ? room.pricePerNight.toFixed(2) 
                          : parseFloat(room.pricePerNight).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusColor(room.status)} text-white`}>
                          {getStatusLabel(room.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/rooms/${room.id}`}
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

        {filteredRooms.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-[#606c38]">No rooms found</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

