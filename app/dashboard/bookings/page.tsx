'use client'
import { useEffect, useState, useCallback } from 'react'
import { getAllBookings } from '@/lib/storage'
import type { Booking, BookingStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import BookingDetailsDrawer from '@/components/BookingDetailsDrawer'
import { Search, Eye, RefreshCw, ChevronLeft, ChevronRight, FileText, Pencil } from 'lucide-react'
import InvoiceModal from '@/components/InvoiceModal'
import EditBookingModal from '@/components/EditBookingModal'

const STATUSES: BookingStatus[] = [
  'Booking Received', 'Team Assigned', 'Confirmed & Scheduled',
  'In Progress', 'Completed', 'Cancelled',
]

const SERVICES = [
  'Residential Borewell', 'Commercial Borewell', 'Agricultural Borewell',
  'Borewell Deepening', 'Borewell Repair', 'Pump Installation',
]

const PAGE_SIZE = 10

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null)
  const [editBooking, setEditBooking] = useState<Booking | null>(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => setBookings(await getAllBookings()), [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, statusFilter, serviceFilter])

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q || b.customerName.toLowerCase().includes(q) || b.bookingId.toLowerCase().includes(q) || b.mobile.includes(q)
    const matchStatus = !statusFilter || b.status === statusFilter
    const matchService = !serviceFilter || b.serviceType === serviceFilter
    return matchSearch && matchStatus && matchService
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, filtered.length)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bookings</h1>
          <p className="text-slate-500 text-sm">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 font-medium text-slate-600 shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, booking ID, mobile..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-600">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-600">
          <option value="">All Services</option>
          {SERVICES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <th className="px-5 py-3.5 text-left">Booking ID</th>
                <th className="px-5 py-3.5 text-left">Customer</th>
                <th className="px-5 py-3.5 text-left">Mobile</th>
                <th className="px-5 py-3.5 text-left">Service</th>
                <th className="px-5 py-3.5 text-left">Depth</th>
                <th className="px-5 py-3.5 text-left">Amount</th>
                <th className="px-5 py-3.5 text-left">Date</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400">No bookings found</td></tr>
              ) : paginated.map(b => (
                <tr key={b.bookingId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-blue-600 whitespace-nowrap">{b.bookingId}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800 whitespace-nowrap">{b.customerName}</div>
                    <div className="text-xs text-slate-400">{b.village}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{b.mobile}</td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{b.serviceType}</td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{b.depth ? `${b.depth} ft` : '—'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(b.estimatedAmount)}</td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                  <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={b.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(b)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => setInvoiceBooking(b)} className="flex items-center gap-1.5 text-orange-600 hover:text-orange-800 font-medium text-xs bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap">
                        <FileText className="w-3.5 h-3.5" /> Invoice
                      </button>
                      <button onClick={() => setEditBooking(b)} className="flex items-center gap-1.5 text-green-600 hover:text-green-800 font-medium text-xs bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            {filtered.length === 0 ? 'No results' : `Showing ${from}–${to} of ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <BookingDetailsDrawer booking={selected} onClose={() => setSelected(null)} onUpdate={load} onEdit={b => { setSelected(null); setEditBooking(b) }} />
      <InvoiceModal booking={invoiceBooking} onClose={() => setInvoiceBooking(null)} />
      <EditBookingModal booking={editBooking} onClose={() => setEditBooking(null)} onUpdate={load} />
    </div>
  )
}
