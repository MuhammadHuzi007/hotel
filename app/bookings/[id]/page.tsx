'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { toNumber } from '@/lib/utils'

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [selectedService, setSelectedService] = useState('')
  const [serviceQuantity, setServiceQuantity] = useState('1')

  useEffect(() => {
    Promise.all([
      fetch(`/api/bookings/${params.id}`).then(res => res.json()),
      fetch('/api/services').then(res => res.json()),
    ]).then(([bookingData, servicesData]) => {
      setBooking(bookingData)
      setServices(servicesData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        const updated = await res.json()
        setBooking(updated)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleAddService = async () => {
    if (!selectedService) return

    try {
      const res = await fetch('/api/room-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          serviceId: selectedService,
          quantity: parseInt(serviceQuantity),
        }),
      })

      if (res.ok) {
        const updated = await fetch(`/api/bookings/${params.id}`).then(res => res.json())
        setBooking(updated)
        setSelectedService('')
        setServiceQuantity('1')
      }
    } catch (error) {
      console.error('Failed to add service:', error)
    }
  }

  const handleAddPayment = async () => {
    if (!paymentAmount) return

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: paymentAmount,
          method: paymentMethod,
        }),
      })

      if (res.ok) {
        const updated = await fetch(`/api/bookings/${params.id}`).then(res => res.json())
        setBooking(updated)
        setPaymentAmount('')
      }
    } catch (error) {
      console.error('Failed to add payment:', error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <p className="text-[#283618]">Loading...</p>
        </div>
      </Layout>
    )
  }

  if (!booking) {
    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <p className="text-[#283618]">Booking not found</p>
        </div>
      </Layout>
    )
  }

  const totalPaid = booking.payments?.reduce((sum: number, p: any) => sum + toNumber(p.amount), 0) || 0
  const totalServices = booking.services?.reduce((sum: number, s: any) => sum + toNumber(s.totalPrice), 0) || 0
  const grandTotal = toNumber(booking.totalAmount) + totalServices
  const balance = grandTotal - totalPaid

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#283618] mb-2">Booking #{booking.id}</h1>
          <p className="text-[#606c38]">Manage booking details, services, and payments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Booking Details */}
          <div className="card">
            <h2 className="text-2xl font-bold text-[#283618] mb-6">Booking Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#606c38] block mb-1">Guest</label>
                <p className="text-[#283618] font-medium text-lg">{booking.guestName}</p>
                {booking.guestEmail && (
                  <p className="text-sm text-[#606c38] mt-1">{booking.guestEmail}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-[#606c38] block mb-1">Room</label>
                <p className="text-[#283618] font-medium">
                  Room {booking.room.roomNumber} ({booking.room.roomType})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#606c38] block mb-1">Check-in</label>
                  <p className="text-[#283618] font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#606c38] block mb-1">Check-out</label>
                  <p className="text-[#283618] font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#606c38] block mb-1">Status</label>
                <span className="badge bg-[#606c38] text-[#fefae0] capitalize">
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Status Actions */}
            <div className="mt-6 space-y-2">
              {booking.status === 'booked' && (
                <button
                  onClick={() => handleStatusChange('checked_in')}
                  className="w-full btn-primary bg-green-600 hover:bg-green-700"
                >
                  ✓ Check In
                </button>
              )}
              {booking.status === 'checked_in' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="w-full btn-primary bg-blue-600 hover:bg-blue-700"
                >
                  ✓ Check Out
                </button>
              )}
              {(booking.status === 'booked' || booking.status === 'checked_in') && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  ✕ Cancel Booking
                </button>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card">
            <h2 className="text-2xl font-bold text-[#283618] mb-6">Financial Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-[#606c38] font-medium">Room Charges</span>
                <span className="font-bold text-[#283618]">${toNumber(booking.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-[#606c38] font-medium">Services</span>
                <span className="font-bold text-[#283618]">${totalServices.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-[#606c38] mt-2">
                <span className="text-lg font-bold text-[#283618]">Total</span>
                <span className="text-lg font-bold text-[#283618]">${grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-[#606c38] font-medium">Paid</span>
                <span className="font-semibold text-[#283618]">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-[#dda15e] mt-2">
                <span className="text-lg font-bold text-[#283618]">Balance</span>
                <span className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${balance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Add Payment */}
            <div className="mt-6 border-t-2 border-[#606c38] pt-6">
              <h3 className="font-bold text-[#283618] mb-4">Add Payment</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input-field"
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="online">Online</option>
                </select>
                <button onClick={handleAddPayment} className="btn-primary w-full">
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="card mt-6">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Services</h2>
          
          {/* Add Service */}
          <div className="mb-6 flex gap-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${toNumber(service.price).toFixed(2)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={serviceQuantity}
              onChange={(e) => setServiceQuantity(e.target.value)}
              className="input-field w-24"
              placeholder="Qty"
            />
            <button
              onClick={handleAddService}
              disabled={!selectedService}
              className="btn-primary disabled:opacity-50"
            >
              Add Service
            </button>
          </div>

          {/* Services List */}
          {booking.services && booking.services.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#606c38] bg-[#fefae0]">
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Service</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {booking.services.map((serviceLog: any) => (
                    <tr key={serviceLog.id} className="hover:bg-[#fefae0] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#283618]">{serviceLog.service.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge bg-[#dda15e] text-[#283618]">{serviceLog.quantity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#283618]">
                          ${toNumber(serviceLog.totalPrice).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#606c38] text-center py-8">No services added</p>
          )}
        </div>

        {/* Payments */}
        <div className="card mt-6">
          <h2 className="text-2xl font-bold text-[#283618] mb-6">Payments</h2>
          {booking.payments && booking.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#606c38] bg-[#fefae0]">
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {booking.payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-[#fefae0] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#283618]">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#283618]">
                          ${toNumber(payment.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge bg-[#606c38] text-[#fefae0] capitalize">
                          {payment.method.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#606c38] text-center py-8">No payments recorded</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

