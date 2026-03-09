'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { toNumber } from '@/lib/utils'

interface UserProfile {
  id: number
  username: string
  email: string
  role: string
}

interface HotelInfo {
  id: number
  name: string
  address: string
  city: string
  phone: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [hotel, setHotel] = useState<HotelInfo | null>(null)
  
  // Profile form
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Hotel form
  const [hotelName, setHotelName] = useState('')
  const [hotelAddress, setHotelAddress] = useState('')
  const [hotelCity, setHotelCity] = useState('')
  const [hotelPhone, setHotelPhone] = useState('')
  
  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setUsername(data.user.username)
        setEmail(data.user.email)
        
        if (data.hotel) {
          setHotel(data.hotel)
          setHotelName(data.hotel.name)
          setHotelAddress(data.hotel.address)
          setHotelCity(data.hotel.city)
          setHotelPhone(data.hotel.phone)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      })

      const data = await res.json()
      if (res.ok) {
        showMessage('success', 'Profile updated successfully!')
        setProfile(data.user)
      } else {
        showMessage('error', data.error || 'Failed to update profile')
      }
    } catch (error) {
      showMessage('error', 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (res.ok) {
        showMessage('success', 'Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showMessage('error', data.error || 'Failed to change password')
      }
    } catch (error) {
      showMessage('error', 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleHotelUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/hotel/info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hotelName,
          address: hotelAddress,
          city: hotelCity,
          phone: hotelPhone,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        showMessage('success', 'Hotel information updated successfully!')
        setHotel(data.hotel)
      } else {
        showMessage('error', data.error || 'Failed to update hotel information')
      }
    } catch (error) {
      showMessage('error', 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications,
          smsNotifications,
          language,
          timezone,
          dateFormat,
        }),
      })

      if (res.ok) {
        showMessage('success', 'Preferences saved successfully!')
      } else {
        showMessage('error', 'Failed to save preferences')
      }
    } catch (error) {
      showMessage('error', 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'password', name: 'Password', icon: '🔒' },
    { id: 'hotel', name: 'Hotel Info', icon: '🏨' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'calendar', name: 'Calendar', icon: '📆' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#283618]">Settings</h1>
            <p className="text-[#606c38] mt-1">Manage your account and system preferences</p>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border-2 border-green-300 text-green-700'
                : 'bg-red-50 border-2 border-red-300 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[#dda15e]">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-[#606c38] text-[#283618]'
                      : 'border-transparent text-[#606c38] hover:text-[#283618] hover:border-[#dda15e]'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card max-w-2xl">
              <h2 className="text-2xl font-bold text-[#283618] mb-6">Profile Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-[#283618] mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    className="input-field w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#283618] mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="input-field w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="card max-w-2xl">
              <h2 className="text-2xl font-bold text-[#283618] mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-semibold text-[#283618] mb-2">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    required
                    className="input-field w-full"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-[#283618] mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    className="input-field w-full"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-[#606c38] mt-1">Must be at least 6 characters</p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#283618] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    className="input-field w-full"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Hotel Info Tab */}
          {activeTab === 'hotel' && (
            <div className="card max-w-2xl">
              <h2 className="text-2xl font-bold text-[#283618] mb-6">Hotel Information</h2>
              {hotel ? (
                <form onSubmit={handleHotelUpdate} className="space-y-6">
                  <div>
                    <label htmlFor="hotelName" className="block text-sm font-semibold text-[#283618] mb-2">
                      Hotel Name
                    </label>
                    <input
                      id="hotelName"
                      type="text"
                      required
                      className="input-field w-full"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="hotelAddress" className="block text-sm font-semibold text-[#283618] mb-2">
                      Address
                    </label>
                    <input
                      id="hotelAddress"
                      type="text"
                      required
                      className="input-field w-full"
                      value={hotelAddress}
                      onChange={(e) => setHotelAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="hotelCity" className="block text-sm font-semibold text-[#283618] mb-2">
                      City
                    </label>
                    <input
                      id="hotelCity"
                      type="text"
                      required
                      className="input-field w-full"
                      value={hotelCity}
                      onChange={(e) => setHotelCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="hotelPhone" className="block text-sm font-semibold text-[#283618] mb-2">
                      Phone Number
                    </label>
                    <input
                      id="hotelPhone"
                      type="tel"
                      required
                      className="input-field w-full"
                      value={hotelPhone}
                      onChange={(e) => setHotelPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[#606c38]">No hotel information available.</p>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="card max-w-2xl">
              <h2 className="text-2xl font-bold text-[#283618] mb-6">System Preferences</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#283618] mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-4 h-4 text-[#606c38] border-gray-300 rounded focus:ring-[#606c38]"
                      />
                      <span className="ml-3 text-[#283618]">Email Notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="w-4 h-4 text-[#606c38] border-gray-300 rounded focus:ring-[#606c38]"
                      />
                      <span className="ml-3 text-[#283618]">SMS Notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#283618] mb-4">Localization</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="language" className="block text-sm font-semibold text-[#283618] mb-2">
                        Language
                      </label>
                      <select
                        id="language"
                        className="input-field w-full"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="timezone" className="block text-sm font-semibold text-[#283618] mb-2">
                        Timezone
                      </label>
                      <select
                        id="timezone"
                        className="input-field w-full"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dateFormat" className="block text-sm font-semibold text-[#283618] mb-2">
                        Date Format
                      </label>
                      <select
                        id="dateFormat"
                        className="input-field w-full"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD MMM YYYY">DD MMM YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePreferencesSave}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && <CalendarContent />}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && <NotificationsContent />}
        </div>
      </div>
    </Layout>
  )
}

// Calendar Component (without Layout wrapper)
function CalendarContent() {
  const [bookings, setBookings] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
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
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
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
    return <div className="text-center py-12 text-[#606c38]">Loading calendar...</div>
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#283618]">Booking Calendar</h2>
          <p className="text-[#606c38] mt-1">View all bookings in calendar format</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigateMonth('prev')} className="btn-secondary">
            ← Previous
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-secondary">
            Today
          </button>
          <button onClick={() => navigateMonth('next')} className="btn-secondary">
            Next →
          </button>
        </div>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-[#283618]">{monthName}</h3>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-bold text-[#283618] py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const dayBookings = getBookingsForDate(date)
            const isToday = date && date.toDateString() === new Date().toDateString()
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
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#606c38]' : 'text-[#283618]'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <Link
                          key={booking.id}
                          href={`/bookings/${booking.id}`}
                          className={`block text-xs p-1 rounded truncate text-white ${getStatusColor(booking.status)} hover:opacity-80 transition-opacity`}
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
  )
}

// Notifications Component (without Layout wrapper)
function NotificationsContent() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    fetchNotifications()
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
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'checkin': return '📥'
      case 'checkout': return '📤'
      case 'maintenance': return '🔧'
      case 'task': return '🧹'
      case 'booking': return '📅'
      case 'payment': return '💳'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'checkin': return 'bg-blue-100 border-blue-300'
      case 'checkout': return 'bg-green-100 border-green-300'
      case 'maintenance': return 'bg-red-100 border-red-300'
      case 'task': return 'bg-yellow-100 border-yellow-300'
      case 'booking': return 'bg-purple-100 border-purple-300'
      case 'payment': return 'bg-indigo-100 border-indigo-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return <div className="text-center py-12 text-[#606c38]">Loading notifications...</div>
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#283618]">Notifications</h2>
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

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`card border-2 ${getNotificationColor(notification.type)} ${
              !notification.read ? 'border-l-4 border-l-[#606c38]' : ''
            } transition-all hover:shadow-md`}
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
                    <Link
                      href={notification.link}
                      className="text-xs text-[#606c38] hover:text-[#283618] font-medium mt-2 inline-block"
                    >
                      View Details →
                    </Link>
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
  )
}

