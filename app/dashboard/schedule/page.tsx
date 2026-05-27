'use client'
import { useEffect, useState } from 'react'
import { getAllBookings } from '@/lib/storage'
import type { Booking } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { Calendar } from 'lucide-react'

export default function SchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  useEffect(() => { getAllBookings().then(setBookings) }, [])

  const scheduled = bookings.filter(b => b.status === 'Confirmed & Scheduled' || b.status === 'In Progress')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Schedule</h1>
        <p className="text-slate-500 text-sm">{scheduled.length} scheduled jobs</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scheduled.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl p-12 text-center text-slate-400 shadow-sm border border-slate-100">
            No scheduled jobs
          </div>
        )}
        {scheduled.map(b => (
          <div key={b.bookingId} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-slate-800">{b.customerName}</div>
                <div className="text-xs text-blue-600 font-mono">{b.bookingId}</div>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex gap-2 text-slate-600"><Calendar className="w-4 h-4 shrink-0 text-slate-400" />{b.scheduledDate ? formatDate(b.scheduledDate) : 'Not scheduled'}</div>
              {b.scheduledTime && <div className="text-slate-500 pl-6">{b.scheduledTime}</div>}
              <div className="text-slate-500">{b.serviceType} · {b.depth} ft</div>
              {b.assignedTeam && <div className="text-slate-500">Team: {b.assignedTeam}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
