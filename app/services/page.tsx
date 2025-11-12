'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { toNumber } from '@/lib/utils'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', price: '' })
  const [editing, setEditing] = useState<any>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      setServices(data)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editing ? `/api/services/${editing.id}` : '/api/services'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        fetchServices()
        setShowForm(false)
        setFormData({ name: '', price: '' })
        setEditing(null)
      }
    } catch (error) {
      console.error('Failed to save service:', error)
    }
  }

  const handleEdit = (service: any) => {
    setEditing(service)
    setFormData({ name: service.name, price: toNumber(service.price).toString() })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
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

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#283618] mb-2">Services</h1>
            <p className="text-[#606c38]">Manage add-on services and amenities</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditing(null)
              setFormData({ name: '', price: '' })
            }}
            className={showForm ? 'btn-secondary' : 'btn-primary'}
          >
            {showForm ? 'Cancel' : '+ Add Service'}
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-[#283618] mb-6">
              {editing ? 'Edit Service' : 'New Service'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#283618] mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#283618] mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card overflow-hidden p-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-[#606c38] bg-[#fefae0]">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#283618] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-[#fefae0] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-[#283618]">{service.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-[#283618]">
                      ${toNumber(service.price).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-[#606c38] hover:text-[#dda15e] font-medium text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

