'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'

export default function QuickActionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const quickActions = [
    {
      id: 'quick-booking',
      title: 'Quick Booking',
      description: 'Create a new booking instantly',
      icon: '📅',
      color: 'from-blue-500 to-blue-600',
      action: () => router.push('/bookings/new'),
    },
    {
      id: 'check-in',
      title: 'Check-in Guest',
      description: 'Process guest check-in',
      icon: '📥',
      color: 'from-green-500 to-green-600',
      action: async () => {
        setLoading('check-in')
        // Find first booked booking for today
        try {
          const res = await fetch('/api/bookings?status=booked')
          if (res.ok) {
            const data = await res.json()
            const bookings = data.bookings || []
            if (bookings.length > 0) {
              router.push(`/bookings/${bookings[0].id}`)
            } else {
              alert('No bookings found for check-in')
            }
          }
        } catch (error) {
          console.error('Failed to fetch bookings:', error)
        } finally {
          setLoading(null)
        }
      },
    },
    {
      id: 'check-out',
      title: 'Check-out Guest',
      description: 'Process guest check-out',
      icon: '📤',
      color: 'from-orange-500 to-orange-600',
      action: async () => {
        setLoading('check-out')
        try {
          const res = await fetch('/api/bookings?status=checked_in')
          if (res.ok) {
            const data = await res.json()
            const bookings = data.bookings || []
            if (bookings.length > 0) {
              router.push(`/bookings/${bookings[0].id}`)
            } else {
              alert('No checked-in guests found')
            }
          }
        } catch (error) {
          console.error('Failed to fetch bookings:', error)
        } finally {
          setLoading(null)
        }
      },
    },
    {
      id: 'add-room',
      title: 'Add Room',
      description: 'Add a new room to the system',
      icon: '🛏️',
      color: 'from-purple-500 to-purple-600',
      action: () => router.push('/rooms'),
    },
    {
      id: 'add-service',
      title: 'Add Service',
      description: 'Create a new service',
      icon: '✨',
      color: 'from-pink-500 to-pink-600',
      action: () => router.push('/services'),
    },
    {
      id: 'create-task',
      title: 'Create Task',
      description: 'Assign a housekeeping task',
      icon: '🧹',
      color: 'from-yellow-500 to-yellow-600',
      action: () => router.push('/housekeeping'),
    },
    {
      id: 'maintenance',
      title: 'Report Issue',
      description: 'Create a maintenance ticket',
      icon: '🔧',
      color: 'from-red-500 to-red-600',
      action: () => router.push('/maintenance'),
    },
    {
      id: 'view-calendar',
      title: 'View Calendar',
      description: 'See all bookings on calendar',
      icon: '📆',
      color: 'from-indigo-500 to-indigo-600',
      action: () => router.push('/calendar'),
    },
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#283618]">Quick Actions</h1>
          <p className="text-[#606c38] mt-1">Fast access to common operations</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              disabled={loading === action.id}
              className={`
                card bg-gradient-to-br ${action.color} text-white
                hover:shadow-xl transform hover:scale-105 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                p-6 text-left
              `}
            >
              <div className="text-4xl mb-3">{action.icon}</div>
              <h3 className="text-lg font-bold mb-1">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
              {loading === action.id && (
                <div className="mt-3 text-sm">Loading...</div>
              )}
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-[#283618] mb-4">Common Workflows</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#fefae0] rounded-lg">
              <div>
                <h3 className="font-semibold text-[#283618]">New Guest Check-in</h3>
                <p className="text-sm text-[#606c38]">1. Find booking → 2. Click Check-in → 3. Update room status</p>
              </div>
              <button
                onClick={() => router.push('/bookings')}
                className="btn-primary text-sm"
              >
                Go to Bookings
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#fefae0] rounded-lg">
              <div>
                <h3 className="font-semibold text-[#283618]">Room Cleaning</h3>
                <p className="text-sm text-[#606c38]">1. Go to Housekeeping → 2. Create task → 3. Assign to staff</p>
              </div>
              <button
                onClick={() => router.push('/housekeeping')}
                className="btn-primary text-sm"
              >
                Go to Housekeeping
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#fefae0] rounded-lg">
              <div>
                <h3 className="font-semibold text-[#283618]">Maintenance Request</h3>
                <p className="text-sm text-[#606c38]">1. Go to Maintenance → 2. Create ticket → 3. Set priority</p>
              </div>
              <button
                onClick={() => router.push('/maintenance')}
                className="btn-primary text-sm"
              >
                Go to Maintenance
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

