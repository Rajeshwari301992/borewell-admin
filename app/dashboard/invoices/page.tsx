'use client'
import { useEffect, useState } from 'react'
import { getAllBookings } from '@/lib/storage'
import type { Booking } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import InvoiceModal from '@/components/InvoiceModal'
import { FileText } from 'lucide-react'

export default function InvoicesPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)
  useEffect(() => { getAllBookings().then(setBookings) }, [])

  const completed = bookings.filter(b => b.status === 'Completed')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
        <p className="text-slate-500 text-sm">{completed.length} completed jobs</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {completed.length === 0 && (
          <div className="col-span-2 bg-white rounded-2xl p-12 text-center text-slate-400 shadow-sm border border-slate-100">
            No completed bookings yet
          </div>
        )}
        {completed.map(b => (
          <div key={b.bookingId} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-slate-400 font-medium mb-0.5">Invoice</div>
                <div className="font-bold text-slate-800 text-lg">{b.bookingId}</div>
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">PAID</span>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-medium">{b.customerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Service</span><span className="font-medium">{b.serviceType}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Final Depth</span><span className="font-medium">{b.finalDepth ? `${b.finalDepth} ft` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{formatDate(b.bookingDate)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                <span className="font-semibold text-slate-700">Total Amount</span>
                <span className="font-bold text-slate-800 text-base">{formatCurrency(b.finalAmount || b.estimatedAmount)}</span>
              </div>
            </div>
            <button
              onClick={() => setSelected(b)}
              className="flex items-center gap-2 text-sm bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" /> View & Print Invoice
            </button>
          </div>
        ))}
      </div>

      <InvoiceModal booking={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
