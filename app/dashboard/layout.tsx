'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isAdmin } from '@/lib/auth'
import { seedDemoBookings } from '@/lib/storage'
import Sidebar from '@/components/Sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/customer-dashboard'); return }
    seedDemoBookings().catch(() => {})
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <header className="shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="text-sm text-slate-500 font-medium">Admin</div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
