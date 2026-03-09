'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface Ticket {
  id: number
  title: string
  description?: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  room?: {
    roomNumber: string
  } | null
  assignee?: {
    username: string
  } | null
  createdAt: string
}

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assigneeId: '',
  })
  const [rooms, setRooms] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetchTickets()
    fetchRooms()
    fetchUsers()
  }, [filter, priorityFilter])

  const fetchTickets = async () => {
    try {
      let params = '?'
      if (filter !== 'all') params += `status=${filter}&`
      if (priorityFilter !== 'all') params += `priority=${priorityFilter}`
      const res = await fetch(`/api/maintenance/tickets${params}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleStatusChange = async (ticketId: number, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ roomId: '', title: '', description: '', priority: 'medium', assigneeId: '' })
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

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
            <h1 className="text-3xl font-bold text-[#283618]">Maintenance Tickets</h1>
            <p className="text-[#606c38] mt-1">Track and manage maintenance issues</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New Ticket'}
          </button>
        </div>

        {/* Create Ticket Form */}
        {showForm && (
          <div className="card">
            <h2 className="text-xl font-bold text-[#283618] mb-4">Create New Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#283618] mb-2">Room (Optional)</label>
                  <select
                    className="input-field w-full"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  >
                    <option value="">General/Facility</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} - {room.roomType}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#283618] mb-2">Priority</label>
                  <select
                    required
                    className="input-field w-full"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#283618] mb-2">Assign To</label>
                  <select
                    className="input-field w-full"
                    value={formData.assigneeId}
                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#283618] mb-2">Title</label>
                <input
                  type="text"
                  required
                  className="input-field w-full"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#283618] mb-2">Description</label>
                <textarea
                  className="input-field w-full"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the maintenance issue..."
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">Create Ticket</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <span className="text-sm font-semibold text-[#283618] self-center">Status:</span>
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#606c38] text-[#fefae0]'
                    : 'bg-[#fefae0] text-[#283618] hover:bg-[#dda15e]'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-4">
            <span className="text-sm font-semibold text-[#283618] self-center">Priority:</span>
            {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  priorityFilter === priority
                    ? 'bg-[#606c38] text-[#fefae0]'
                    : 'bg-[#fefae0] text-[#283618] hover:bg-[#dda15e]'
                }`}
              >
                {priority === 'all' ? 'All' : priority.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-[#606c38]">
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#fefae0] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#283618]">
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-[#283618]">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-xs text-[#606c38] mt-1 line-clamp-2">
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.room ? (
                        <span className="badge bg-[#606c38] text-[#fefae0]">
                          {ticket.room.roomNumber}
                        </span>
                      ) : (
                        <span className="text-sm text-[#606c38]">General</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                      {ticket.assignee ? ticket.assignee.username : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#606c38]">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value as any)}
                        className="text-xs px-2 py-1 border border-[#dda15e] rounded bg-white text-[#283618]"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && (
              <div className="text-center py-8 text-[#606c38]">No tickets found</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

