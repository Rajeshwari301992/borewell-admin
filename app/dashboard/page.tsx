'use client'
import { useEffect, useState, useCallback } from 'react'
import { getAllBookings, getNotifications, markNotificationsRead } from '@/lib/storage'
import type { Booking, Notification } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import BookingDetailsDrawer from '@/components/BookingDetailsDrawer'
import { BookOpen, Clock, Loader, CheckCircle2, DollarSign, Bell, Eye } from 'lucide-react'

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)
  const [showNotifs, setShowNotifs] = useState(false)

  const load = useCallback(async () => {
    setBookings(await getAllBookings())
    setNotifications(getNotifications())
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const total = bookings.length
  const pending = bookings.filter(b => b.status === 'Booking Received').length
  const inProgress = bookings.filter(b => b.status === 'In Progress').length
  const completed = bookings.filter(b => b.status === 'Completed').length
  const revenue = bookings.filter(b => b.status === 'Completed').reduce((s, b) => s + (b.finalAmount || b.estimatedAmount), 0)
  const unread = notifications.filter(n => !n.read).length

  const STATS = [
    { label: 'Total Bookings', value: total, icon: BookOpen, light: 'bg-blue-50 text-blue-600' },
    { label: 'Pending', value: pending, icon: Clock, light: 'bg-gray-50 text-gray-600' },
    { label: 'In Progress', value: inProgress, icon: Loader, light: 'bg-orange-50 text-orange-600' },
    { label: 'Completed', value: completed, icon: CheckCircle2, light: 'bg-green-50 text-green-600' },
    { label: 'Total Revenue', value: formatCurrency(revenue), icon: DollarSign, light: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview of all borewell bookings</p>
        </div>
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(v => !v); markNotificationsRead(); setNotifications(n => n.map(x => ({ ...x, read: true }))) }}
            className="relative w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 shadow-sm"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unread}</span>}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">Notifications</div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0
                  ? <div className="px-4 py-6 text-center text-slate-400 text-sm">No notifications</div>
                  : notifications.slice(0, 10).map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50">
                      <div className="text-sm text-slate-700">{n.message}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(n.timestamp).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center mb-3 ${s.light}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Recent Bookings</h2>
          <a href="/dashboard/bookings" className="text-sm text-blue-600 hover:underline font-medium">View All →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Booking ID</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Service</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.slice(0, 5).map(b => (
                <tr key={b.bookingId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-blue-600">{b.bookingId}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{b.customerName}</div>
                    <div className="text-xs text-slate-400">{b.mobile}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{b.serviceType}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(b.estimatedAmount)}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(b.bookingDate)}</td>
                  <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelected(b)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BookingDetailsDrawer booking={selected} onClose={() => setSelected(null)} onUpdate={load} />
    </div>
  )
}
