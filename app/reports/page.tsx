'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
    fetchReports(firstDay.toISOString().split('T')[0], today.toISOString().split('T')[0])
  }, [])

  const fetchReports = async (start?: string, end?: string) => {
    setLoading(true)
    try {
      const startParam = start || startDate
      const endParam = end || endDate
      const res = await fetch(`/api/reports?startDate=${startParam}&endDate=${endParam}`)
      const data = await res.json()
      setReports(data)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = () => {
    if (startDate && endDate) {
      fetchReports()
    }
  }

  if (loading || !reports) {
    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <p className="text-[#283618]">Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#283618] mb-2">Reports</h1>
          <p className="text-[#606c38]">Analytics and performance metrics</p>
        </div>

        {/* Date Range */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#283618] mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button onClick={handleDateChange} className="btn-primary w-full">
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card bg-gradient-to-br from-[#606c38] to-[#4a5530] text-[#fefae0]">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Occupancy Rate</h3>
            <p className="text-3xl font-bold">
              {reports.occupancyRate?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="card bg-gradient-to-br from-[#dda15e] to-[#bc6c25] text-[#fefae0]">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Total Revenue</h3>
            <p className="text-3xl font-bold">
              ${reports.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-[#283618] to-[#1a2410] text-[#fefae0]">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Cancellations</h3>
            <p className="text-3xl font-bold">{reports.cancellations || 0}</p>
          </div>
          <div className="card bg-gradient-to-br from-[#606c38] to-[#4a5530] text-[#fefae0]">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Total Rooms</h3>
            <p className="text-3xl font-bold">{reports.totalRooms || 0}</p>
          </div>
        </div>

        {/* Room Status Breakdown */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Room Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(reports.roomStatusCounts || {}).map(([status, count]: [string, any]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Day */}
        {reports.revenueByDay && Object.keys(reports.revenueByDay).length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-[#283618] mb-6">Revenue by Day</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#606c38] bg-[#fefae0]">
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(reports.revenueByDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, revenue]: [string, any]) => (
                      <tr key={date} className="hover:bg-[#fefae0] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                          {new Date(date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-[#283618]">
                            ${revenue.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

