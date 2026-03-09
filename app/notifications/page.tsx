'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface Notification {
  id: number
  type: 'checkin' | 'checkout' | 'maintenance' | 'task' | 'booking' | 'payment'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [filter])

  const fetchNotifications = async () => {
    try {
      const params = filter !== 'all' ? `?filter=${filter}` : ''
      const res = await fetch(`/api/notifications${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return '📥'
      case 'checkout':
        return '📤'
      case 'maintenance':
        return '🔧'
      case 'task':
        return '🧹'
      case 'booking':
        return '📅'
      case 'payment':
        return '💳'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'checkin':
        return 'bg-blue-100 border-blue-300'
      case 'checkout':
        return 'bg-green-100 border-green-300'
      case 'maintenance':
        return 'bg-red-100 border-red-300'
      case 'task':
        return 'bg-yellow-100 border-yellow-300'
      case 'booking':
        return 'bg-purple-100 border-purple-300'
      case 'payment':
        return 'bg-indigo-100 border-indigo-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

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
            <h1 className="text-3xl font-bold text-[#283618]">Notifications</h1>
            <p className="text-[#606c38] mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn-secondary text-sm">
                Mark All Read
              </button>
            )}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                card border-2 ${getNotificationColor(notification.type)}
                ${!notification.read ? 'border-l-4 border-l-[#606c38]' : ''}
                transition-all hover:shadow-md
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#283618]">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-[#606c38] rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-[#606c38] mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    {notification.link && (
                      <a
                        href={notification.link}
                        className="text-xs text-[#606c38] hover:text-[#283618] font-medium mt-2 inline-block"
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs px-3 py-1 bg-[#606c38] text-[#fefae0] rounded hover:bg-[#4a5530] transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">🔔</div>
              <p className="text-[#606c38] text-lg">No notifications</p>
              <p className="text-sm text-gray-500 mt-2">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

