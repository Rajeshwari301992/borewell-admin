'use client'
import { useEffect, useState } from 'react'
import { getAllBookings } from '@/lib/storage'
import type { Booking } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  useEffect(() => { getAllBookings().then(setBookings) }, [])

  const completed = bookings.filter(b => b.status === 'Completed')
  const total = completed.reduce((s, b) => s + (b.finalAmount || b.estimatedAmount), 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-slate-500 text-sm">Collected from completed jobs</p>
      </div>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow">
        <div className="text-sm opacity-75 mb-1">Total Revenue Collected</div>
        <div className="text-4xl font-bold">{formatCurrency(total)}</div>
        <div className="text-sm opacity-60 mt-1">{completed.length} completed jobs</div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-5 py-3.5 text-left">Booking ID</th>
                <th className="px-5 py-3.5 text-left">Customer</th>
                <th className="px-5 py-3.5 text-left">Service</th>
                <th className="px-5 py-3.5 text-left">Completion Date</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {completed.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No payments yet</td></tr>
              ) : completed.map(b => (
                <tr key={b.bookingId} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono font-semibold text-blue-600">{b.bookingId}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{b.customerName}</td>
                  <td className="px-5 py-4 text-slate-600">{b.serviceType}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(b.bookingDate)}</td>
                  <td className="px-5 py-4 font-bold text-green-600 text-right">{formatCurrency(b.finalAmount || b.estimatedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
