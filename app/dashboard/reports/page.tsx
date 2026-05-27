'use client'
import { useEffect, useState } from 'react'
import { getAllBookings } from '@/lib/storage'
import type { Booking } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  useEffect(() => { getAllBookings().then(setBookings) }, [])

  const byService = bookings.reduce((acc, b) => {
    acc[b.serviceType] = (acc[b.serviceType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const revenue = bookings.filter(b => b.status === 'Completed').reduce((s, b) => s + (b.finalAmount || b.estimatedAmount), 0)
  const cancellations = bookings.filter(b => b.status === 'Cancelled').length
  const avgDepth = bookings.filter(b => b.depth > 0).reduce((s, b, _, arr) => s + b.depth / arr.length, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-500 text-sm">Business overview and analytics</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(revenue), color: 'text-green-600' },
          { label: 'Total Bookings', value: String(bookings.length), color: 'text-blue-600' },
          { label: 'Cancellations', value: String(cancellations), color: 'text-red-500' },
          { label: 'Avg Depth', value: `${Math.round(avgDepth)} ft`, color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-4">Bookings by Service</h2>
        <div className="space-y-3">
          {Object.entries(byService).map(([service, count]) => {
            const pct = Math.round((count / bookings.length) * 100)
            return (
              <div key={service}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{service}</span>
                  <span className="font-semibold text-slate-800">{count} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
