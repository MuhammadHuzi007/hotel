'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Quick Actions', href: '/quick-actions', icon: '⚡' },
  { name: 'Rooms', href: '/rooms', icon: '🛏️' },
  { name: 'Bookings', href: '/bookings', icon: '📅' },
  { name: 'Guests', href: '/guests', icon: '👥' },
  { name: 'Services', href: '/services', icon: '✨' },
  { name: 'Housekeeping', href: '/housekeeping', icon: '🧹' },
  { name: 'Maintenance', href: '/maintenance', icon: '🔧' },
  { name: 'Reports', href: '/reports', icon: '📈' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          w-64 bg-[#283618] text-[#fefae0]
          shadow-2xl
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#606c38] flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#dda15e] rounded-lg flex items-center justify-center text-lg">
                🏨
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#fefae0]">Hotel Ops</h1>
                <p className="text-xs text-[#dda15e]">Management</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-[#fefae0] hover:text-[#dda15e] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 mb-1
                    ${
                      isActive
                        ? 'bg-[#606c38] text-[#fefae0] shadow-lg'
                        : 'text-[#dda15e] hover:bg-[#606c38] hover:text-[#fefae0]'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )
            })}

            {/* Divider */}
            <div className="my-2 border-t border-[#606c38]" />

            {/* Settings */}
            <Link
              href="/configs"
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                ${
                  pathname === '/configs'
                    ? 'bg-[#606c38] text-[#fefae0] shadow-lg'
                    : 'text-[#dda15e] hover:bg-[#606c38] hover:text-[#fefae0]'
                }
              `}
              onClick={() => setIsOpen(false)}
            >
              <span className="text-lg">⚙️</span>
              <span className="font-medium text-sm">Settings</span>
            </Link>
          </nav>

          {/* Footer - Always Visible */}
          <div className="p-3 border-t border-[#606c38] space-y-2 flex-shrink-0 bg-[#283618]">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#606c38] bg-opacity-50">
              <div className="w-8 h-8 bg-[#dda15e] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#fefae0] truncate">Admin User</p>
                <p className="text-xs text-[#dda15e] truncate">admin@hotel.com</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 rounded-lg bg-[#bc6c25] text-[#fefae0] font-medium hover:bg-[#a55a1f] transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 bg-[#283618] text-[#fefae0] p-2 rounded-lg shadow-lg"
      >
        ☰
      </button>
    </>
  )
}

