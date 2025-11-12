'use client'

import Sidebar from './Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#fefae0]">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  )
}

