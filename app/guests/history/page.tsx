'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { toNumber } from '@/lib/utils'

interface Guest {
  guestName: string
  guestEmail?: string | null
  guestPhone?: string | null
  totalBookings: number
  totalSpent: number
  lastVisit?: string
  firstVisit?: string
  bookings: Array<{
    id: number
    checkIn: string
    checkOut: string
    status: string
    totalAmount: any
    room: {
      roomNumber: string
    }
  }>
}

export default function GuestHistoryPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGuest, setSelectedGuest] = useState<any>(null)
  const [guestDetails, setGuestDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchGuestHistory()
  }, [])

  const fetchGuestHistory = async () => {
    try {
      const res = await fetch('/api/guests/history')
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests || [])
      }
    } catch (error) {
      console.error('Failed to fetch guest history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = guests.filter((guest) => {
    const search = searchTerm.toLowerCase()
    return (
      guest.guestName.toLowerCase().includes(search) ||
      guest.guestEmail?.toLowerCase().includes(search) ||
      guest.guestPhone?.includes(search)
    )
  })

  const fetchGuestDetails = async (guestName: string) => {
    setLoadingDetails(true)
    setSelectedGuest(guestName)
    try {
      const res = await fetch(`/api/guests/${encodeURIComponent(guestName)}/details`)
      if (res.ok) {
        const data = await res.json()
        setGuestDetails(data)
      }
    } catch (error) {
      console.error('Failed to fetch guest details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setSelectedGuest(null)
    setGuestDetails(null)
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
            <h1 className="text-3xl font-bold text-[#283618]">Guest History</h1>
            <p className="text-[#606c38] mt-1">Past guests who have checked out</p>
          </div>
          <div className="flex gap-2">
            <Link href="/guests" className="btn-secondary">
              ← Current Guests
            </Link>
            <div className="w-64">
              <input
                type="text"
                placeholder="Search guests..."
                className="input-field w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Guest Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-[#606c38] to-[#4a5530] text-[#fefae0]">
            <div className="text-sm opacity-90">Total Past Guests</div>
            <div className="text-3xl font-bold mt-1">{guests.length}</div>
          </div>
          <div className="card bg-gradient-to-br from-[#dda15e] to-[#bc6c25] text-[#fefae0]">
            <div className="text-sm opacity-90">Total Bookings</div>
            <div className="text-3xl font-bold mt-1">
              {guests.reduce((sum, g) => sum + g.totalBookings, 0)}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-[#283618] to-[#1a2410] text-[#fefae0]">
            <div className="text-sm opacity-90">Total Revenue</div>
            <div className="text-3xl font-bold mt-1">
              ${guests.reduce((sum, g) => sum + g.totalSpent, 0).toFixed(0)}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-[#bc6c25] to-[#a55a1f] text-[#fefae0]">
            <div className="text-sm opacity-90">Avg. per Guest</div>
            <div className="text-3xl font-bold mt-1">
              ${guests.length > 0 ? (guests.reduce((sum, g) => sum + g.totalSpent, 0) / guests.length).toFixed(0) : 0}
            </div>
          </div>
        </div>

        {/* Guests List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-[#606c38]">
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Guest Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">First Visit</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Last Visit</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#283618] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGuests.map((guest, index) => (
                  <tr key={index} className="hover:bg-[#fefae0] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#283618]">{guest.guestName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#283618]">
                        {guest.guestEmail && (
                          <div className="text-[#606c38]">{guest.guestEmail}</div>
                        )}
                        {guest.guestPhone && (
                          <div className="text-[#606c38]">{guest.guestPhone}</div>
                        )}
                        {!guest.guestEmail && !guest.guestPhone && (
                          <span className="text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge bg-[#606c38] text-[#fefae0]">
                        {guest.totalBookings}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-[#283618]">
                        ${guest.totalSpent.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#606c38]">
                      {guest.firstVisit
                        ? new Date(guest.firstVisit).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#606c38]">
                      {guest.lastVisit
                        ? new Date(guest.lastVisit).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => fetchGuestDetails(guest.guestName)}
                        className="text-[#606c38] hover:text-[#dda15e] font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredGuests.length === 0 && (
              <div className="text-center py-8 text-[#606c38]">
                {searchTerm ? 'No guests found matching your search' : 'No guest history found'}
              </div>
            )}
          </div>
        </div>

        {/* Guest Details Modal */}
        {selectedGuest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#606c38] p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#283618]">
                  Complete Guest History: {selectedGuest}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-[#606c38] hover:text-[#dda15e] text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {loadingDetails ? (
                  <div className="text-center py-12">
                    <div className="text-[#606c38]">Loading guest details...</div>
                  </div>
                ) : guestDetails ? (
                  <>
                    {/* Guest Information */}
                    <div className="card">
                      <h3 className="text-xl font-bold text-[#283618] mb-4">Guest Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-[#606c38]">Name</p>
                          <p className="font-semibold text-[#283618]">{guestDetails.guest?.guestName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#606c38]">Email</p>
                          <p className="font-semibold text-[#283618]">{guestDetails.guest?.guestEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#606c38]">Phone</p>
                          <p className="font-semibold text-[#283618]">{guestDetails.guest?.guestPhone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="card bg-gradient-to-br from-[#606c38] to-[#4a5530] text-[#fefae0]">
                        <div className="text-sm opacity-90">Total Bookings</div>
                        <div className="text-2xl font-bold mt-1">{guestDetails.summary.totalBookings}</div>
                      </div>
                      <div className="card bg-gradient-to-br from-[#dda15e] to-[#bc6c25] text-[#fefae0]">
                        <div className="text-sm opacity-90">Total Spent</div>
                        <div className="text-2xl font-bold mt-1">${guestDetails.summary.totalSpent.toFixed(2)}</div>
                      </div>
                      <div className="card bg-gradient-to-br from-[#283618] to-[#1a2410] text-[#fefae0]">
                        <div className="text-sm opacity-90">Services Total</div>
                        <div className="text-2xl font-bold mt-1">${guestDetails.summary.totalServices.toFixed(2)}</div>
                      </div>
                      <div className="card bg-gradient-to-br from-[#bc6c25] to-[#a55a1f] text-[#fefae0]">
                        <div className="text-sm opacity-90">Payments Total</div>
                        <div className="text-2xl font-bold mt-1">${guestDetails.summary.totalPayments.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* All Bookings */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-[#283618]">All Bookings</h3>
                      {guestDetails.bookings.map((booking: any, index: number) => {
                        const servicesTotal = booking.services.reduce((sum: number, s: any) => sum + toNumber(s.totalPrice), 0)
                        const paymentsTotal = booking.payments.reduce((sum: number, p: any) => sum + toNumber(p.amount), 0)
                        const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))
                        
                        return (
                          <div key={booking.id} className="card border-2 border-[#dda15e]">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-[#283618]">
                                  Booking #{booking.id} - {index + 1} of {guestDetails.bookings.length}
                                </h4>
                                <p className="text-sm text-[#606c38]">
                                  {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()} ({nights} nights)
                                </p>
                              </div>
                              <span className={`badge ${
                                booking.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : 'bg-red-100 text-red-800 border-red-300'
                              }`}>
                                {booking.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-[#606c38]">Room</p>
                                <p className="font-semibold text-[#283618]">
                                  {booking.room.roomNumber} - {booking.room.roomType}
                                </p>
                                <p className="text-xs text-[#606c38]">
                                  ${toNumber(booking.room.pricePerNight).toFixed(2)}/night
                                </p>
                              </div>
                              {booking.ratePlan && (
                                <div>
                                  <p className="text-sm text-[#606c38]">Rate Plan</p>
                                  <p className="font-semibold text-[#283618]">{booking.ratePlan.name}</p>
                                </div>
                              )}
                            </div>

                            {/* Services */}
                            {booking.services.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-[#283618] mb-2">Services Used:</p>
                                <div className="space-y-2">
                                  {booking.services.map((serviceLog: any) => (
                                    <div key={serviceLog.id} className="flex items-center justify-between bg-[#fefae0] p-2 rounded">
                                      <div>
                                        <span className="font-medium text-[#283618]">{serviceLog.service.name}</span>
                                        <span className="text-sm text-[#606c38] ml-2">
                                          (Qty: {serviceLog.quantity})
                                        </span>
                                      </div>
                                      <span className="font-semibold text-[#283618]">
                                        ${toNumber(serviceLog.totalPrice).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex justify-end pt-2 border-t border-[#dda15e]">
                                    <span className="font-bold text-[#283618]">
                                      Services Total: ${servicesTotal.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Payments */}
                            {booking.payments.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-[#283618] mb-2">Payments:</p>
                                <div className="space-y-2">
                                  {booking.payments.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between bg-[#fefae0] p-2 rounded">
                                      <div>
                                        <span className="font-medium text-[#283618]">
                                          {new Date(payment.paymentDate).toLocaleDateString()}
                                        </span>
                                        <span className="text-sm text-[#606c38] ml-2">
                                          ({payment.method.replace('_', ' ')})
                                        </span>
                                      </div>
                                      <span className="font-semibold text-[#283618]">
                                        ${toNumber(payment.amount).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex justify-end pt-2 border-t border-[#dda15e]">
                                    <span className="font-bold text-[#283618]">
                                      Payments Total: ${paymentsTotal.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Financial Summary */}
                            <div className="bg-[#fefae0] p-4 rounded-lg">
                              <p className="text-sm font-semibold text-[#283618] mb-2">Financial Summary:</p>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-[#606c38]">Room Charges:</span>
                                  <span className="font-semibold text-[#283618]">
                                    ${toNumber(booking.nightlyTotal || booking.totalAmount).toFixed(2)}
                                  </span>
                                </div>
                                {servicesTotal > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-[#606c38]">Services:</span>
                                    <span className="font-semibold text-[#283618]">${servicesTotal.toFixed(2)}</span>
                                  </div>
                                )}
                                {toNumber(booking.taxTotal || 0) > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-[#606c38]">Taxes:</span>
                                    <span className="font-semibold text-[#283618]">
                                      ${toNumber(booking.taxTotal).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                {toNumber(booking.feeTotal || 0) > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-[#606c38]">Fees:</span>
                                    <span className="font-semibold text-[#283618]">
                                      ${toNumber(booking.feeTotal).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-[#dda15e] font-bold text-[#283618]">
                                  <span>Grand Total:</span>
                                  <span>${toNumber(booking.grandTotal || booking.totalAmount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                  <span className="text-[#606c38]">Amount Paid:</span>
                                  <span className="font-semibold text-[#283618]">${paymentsTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                  <span className="text-[#606c38]">Balance:</span>
                                  <span className={`font-semibold ${
                                    (toNumber(booking.grandTotal || booking.totalAmount) - paymentsTotal) > 0
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  }`}>
                                    ${(toNumber(booking.grandTotal || booking.totalAmount) - paymentsTotal).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="mt-4">
                                <p className="text-sm font-semibold text-[#283618] mb-1">Notes:</p>
                                <p className="text-sm text-[#606c38] bg-[#fefae0] p-2 rounded">{booking.notes}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[#606c38]">No details found for this guest</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

