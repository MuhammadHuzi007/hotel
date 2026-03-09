'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface Task {
  id: number
  title: string
  status: 'todo' | 'in_progress' | 'done'
  room: {
    id: number
    roomNumber: string
  }
  assignee?: {
    username: string
  } | null
  dueDate?: string | null
  notes?: string | null
}

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    assigneeId: '',
    dueDate: '',
    notes: '',
  })
  const [rooms, setRooms] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetchTasks()
    fetchRooms()
    fetchUsers()
  }, [filter])

  const fetchTasks = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/housekeeping/tasks${params}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
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

  const handleStatusChange = async (taskId: number, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const res = await fetch(`/api/housekeeping/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/housekeeping/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ roomId: '', title: '', assigneeId: '', dueDate: '', notes: '' })
        fetchTasks()
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
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
            <h1 className="text-3xl font-bold text-[#283618]">Housekeeping Tasks</h1>
            <p className="text-[#606c38] mt-1">Manage room cleaning and maintenance tasks</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>

        {/* Create Task Form */}
        {showForm && (
          <div className="card">
            <h2 className="text-xl font-bold text-[#283618] mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#283618] mb-2">Room</label>
                  <select
                    required
                    className="input-field w-full"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  >
                    <option value="">Select Room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} - {room.roomType}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#283618] mb-2">Title</label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Deep cleaning, Change linens"
                  />
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
                <div>
                  <label className="block text-sm font-semibold text-[#283618] mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    className="input-field w-full"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#283618] mb-2">Notes</label>
                <textarea
                  className="input-field w-full"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or instructions..."
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-[#606c38] text-[#fefae0]'
                  : 'bg-[#fefae0] text-[#283618] hover:bg-[#dda15e]'
              }`}
            >
              {status === 'all' ? 'All Tasks' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Task Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#283618]">To Do</h2>
              <span className="badge bg-yellow-100 text-yellow-800 border-yellow-300">
                {groupedTasks.todo.length}
              </span>
            </div>
            <div className="space-y-3">
              {groupedTasks.todo.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {groupedTasks.todo.length === 0 && (
                <p className="text-sm text-[#606c38] text-center py-4">No tasks</p>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#283618]">In Progress</h2>
              <span className="badge bg-blue-100 text-blue-800 border-blue-300">
                {groupedTasks.in_progress.length}
              </span>
            </div>
            <div className="space-y-3">
              {groupedTasks.in_progress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {groupedTasks.in_progress.length === 0 && (
                <p className="text-sm text-[#606c38] text-center py-4">No tasks</p>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#283618]">Done</h2>
              <span className="badge bg-green-100 text-green-800 border-green-300">
                {groupedTasks.done.length}
              </span>
            </div>
            <div className="space-y-3">
              {groupedTasks.done.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {groupedTasks.done.length === 0 && (
                <p className="text-sm text-[#606c38] text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: number, status: 'todo' | 'in_progress' | 'done') => void }) {
  const statusOptions: ('todo' | 'in_progress' | 'done')[] = ['todo', 'in_progress', 'done']
  const currentIndex = statusOptions.indexOf(task.status)

  return (
    <div className="bg-white border-2 border-[#dda15e] rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Link href={`/rooms/${task.room.id}`} className="text-sm font-semibold text-[#606c38] hover:text-[#283618]">
          Room {task.room.roomNumber}
        </Link>
      </div>
      <h3 className="font-semibold text-[#283618] mb-2">{task.title}</h3>
      {task.assignee && (
        <p className="text-xs text-[#606c38] mb-2">Assigned to: {task.assignee.username}</p>
      )}
      {task.dueDate && (
        <p className="text-xs text-[#606c38] mb-2">
          Due: {new Date(task.dueDate).toLocaleString()}
        </p>
      )}
      {task.notes && (
        <p className="text-xs text-[#606c38] mb-3 line-clamp-2">{task.notes}</p>
      )}
      <div className="flex gap-2">
        {currentIndex > 0 && (
          <button
            onClick={() => onStatusChange(task.id, statusOptions[currentIndex - 1])}
            className="text-xs px-2 py-1 bg-[#fefae0] text-[#283618] rounded hover:bg-[#dda15e] transition-colors"
          >
            ← Prev
          </button>
        )}
        {currentIndex < statusOptions.length - 1 && (
          <button
            onClick={() => onStatusChange(task.id, statusOptions[currentIndex + 1])}
            className="text-xs px-2 py-1 bg-[#606c38] text-[#fefae0] rounded hover:bg-[#4a5530] transition-colors ml-auto"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

