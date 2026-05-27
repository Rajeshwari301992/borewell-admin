'use client'
import { useEffect, useState } from 'react'
import { getAllBookings } from '@/lib/storage'
import type { Booking } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { Users } from 'lucide-react'

export default function TeamsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  useEffect(() => { getAllBookings().then(setBookings) }, [])

  const assigned = bookings.filter(b => b.assignedTeam)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Teams</h1>
        <p className="text-slate-500 text-sm">Team assignments across all bookings</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-5 py-3.5 text-left">Booking ID</th>
                <th className="px-5 py-3.5 text-left">Customer</th>
                <th className="px-5 py-3.5 text-left">Team</th>
                <th className="px-5 py-3.5 text-left">Operator</th>
                <th className="px-5 py-3.5 text-left">Vehicle</th>
                <th className="px-5 py-3.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assigned.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No team assignments yet</td></tr>
              ) : assigned.map(b => (
                <tr key={b.bookingId} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono font-semibold text-blue-600">{b.bookingId}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{b.customerName}</td>
                  <td className="px-5 py-4 text-slate-600">{b.assignedTeam || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{b.assignedOperator || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{b.assignedVehicle || '—'}</td>
                  <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
