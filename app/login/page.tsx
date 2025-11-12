'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Quick fill for demo purposes
  const handleRoleChange = (newRole: 'admin' | 'employee') => {
    setRole(newRole)
    if (newRole === 'admin') {
      setUsername('admin')
      setPassword('admin123')
    } else {
      setUsername('employee')
      setPassword('employee123')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fefae0] via-[#dda15e] to-[#bc6c25]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-2xl border-2 border-[#606c38]">
        <div>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#606c38] rounded-2xl flex items-center justify-center text-4xl shadow-lg">
              🏨
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#283618]">
            Hotel Management System
          </h2>
          <p className="mt-2 text-center text-sm text-[#606c38]">
            Sign in to your account
          </p>
        </div>
        
        {/* Role Selection */}
        <div className="mt-4 p-4 bg-[#fefae0] rounded-lg border border-[#dda15e]">
          <label className="block text-sm font-semibold text-[#283618] mb-3">
            Login as:
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === 'admin'}
                onChange={() => handleRoleChange('admin')}
                className="h-4 w-4 text-[#606c38] focus:ring-[#606c38] border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-[#283618]">Admin</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="role"
                value="employee"
                checked={role === 'employee'}
                onChange={() => handleRoleChange('employee')}
                className="h-4 w-4 text-[#606c38] focus:ring-[#606c38] border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-[#283618]">Employee</span>
            </label>
          </div>
          <p className="text-xs text-[#606c38] font-medium">
            {role === 'admin' 
              ? 'Default: admin / admin123' 
              : 'Default: employee / employee123'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#283618] mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#283618] mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

