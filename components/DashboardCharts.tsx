'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DashboardChartsProps {
  reports: {
    revenueByDay: Array<{ date: string; revenue: number }>
    bookingStatusCounts: Record<string, number>
    revenueByService: Array<{ name: string; revenue: number }>
    occupancyByDay: Array<{ date: string; occupancy: number }>
  }
}

const COLORS = ['#606c38', '#dda15e', '#bc6c25', '#283618', '#fefae0']

export default function DashboardCharts({ reports }: DashboardChartsProps) {
  // Prepare data for charts
  const bookingStatusData = Object.entries(reports.bookingStatusCounts || {}).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value,
  }))

  const serviceRevenueData = (reports.revenueByService || [])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // If no data, show empty state
  if (reports.revenueByDay.length === 0 && bookingStatusData.length === 0) {
    return (
      <div className="card mb-8">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-[#606c38] text-lg">No chart data available yet</p>
          <p className="text-sm text-gray-500 mt-2">Charts will appear as you add bookings and revenue data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Revenue Trend Chart */}
      {reports.revenueByDay.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Revenue Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reports.revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dda15e" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#606c38"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#606c38"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fefae0', 
                border: '2px solid #606c38',
                borderRadius: '8px'
              }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#606c38" 
              strokeWidth={3}
              dot={{ fill: '#dda15e', r: 4 }}
              name="Daily Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Trend */}
        <div className="card">
          <h2 className="text-xl font-bold text-[#283618] mb-6">Occupancy Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reports.occupancyByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dda15e" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#606c38"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#606c38"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fefae0', 
                  border: '2px solid #606c38',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Occupancy']}
              />
              <Bar 
                dataKey="occupancy" 
                fill="#606c38"
                radius={[8, 8, 0, 0]}
                name="Occupancy %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Distribution */}
        {bookingStatusData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-[#283618] mb-6">Booking Status Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={bookingStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fefae0', 
                  border: '2px solid #606c38',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Service */}
        {serviceRevenueData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-[#283618] mb-6">Top Services Revenue</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={serviceRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#dda15e" opacity={0.3} />
                <XAxis 
                  type="number"
                  stroke="#606c38"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  stroke="#606c38"
                  style={{ fontSize: '12px' }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fefae0', 
                    border: '2px solid #606c38',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#dda15e"
                  radius={[0, 8, 8, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue Summary */}
        <div className="card">
          <h2 className="text-xl font-bold text-[#283618] mb-6">Revenue Summary (Last 30 Days)</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#606c38] to-[#4a5530] text-[#fefae0] rounded-lg">
              <span className="font-semibold">Total Revenue</span>
              <span className="text-2xl font-bold">
                ${reports.revenueByDay.length > 0 
                  ? reports.revenueByDay.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)
                  : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#dda15e] to-[#bc6c25] text-[#fefae0] rounded-lg">
              <span className="font-semibold">Average Daily</span>
              <span className="text-2xl font-bold">
                ${reports.revenueByDay.length > 0
                  ? (reports.revenueByDay.reduce((sum, day) => sum + day.revenue, 0) / 30).toFixed(2)
                  : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#283618] to-[#1a2410] text-[#fefae0] rounded-lg">
              <span className="font-semibold">Peak Day</span>
              <span className="text-2xl font-bold">
                ${reports.revenueByDay.length > 0
                  ? Math.max(...reports.revenueByDay.map(d => d.revenue)).toFixed(2)
                  : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

