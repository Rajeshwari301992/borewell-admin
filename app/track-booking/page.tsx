'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, CheckCircle2, Clock, Circle, XCircle, Phone,
  MessageCircle, Printer, RotateCcw, User, Calendar,
  Wrench, AlertCircle, Loader2, Hash, Users, Package,
  ChevronRight, Droplets, MapPin,
} from 'lucide-react'
import type { Booking, BookingStatus } from '@/lib/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api'
const COMPANY_PHONE = '+918310008194'
const COMPANY_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918310008194'
const RECENT_KEY = 'sk_track_recent'
const MAX_RECENT = 5
const POLL_MS = 30_000

const STEPS: BookingStatus[] = [
  'Booking Received',
  'Team Assigned',
  'Confirmed & Scheduled',
  'In Progress',
  'Completed',
]

const STATUS_META: Record<BookingStatus, { bg: string; text: string; ring: string; dot: string }> = {
  'Booking Received':      { bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200',   dot: 'bg-blue-500' },
  'Team Assigned':         { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200', dot: 'bg-purple-500' },
  'Confirmed & Scheduled': { bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200',  dot: 'bg-amber-500' },
  'In Progress':           { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', dot: 'bg-orange-500' },
  'Completed':             { bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-200',  dot: 'bg-green-500' },
  'Cancelled':             { bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200',    dot: 'bg-red-500' },
}

function stepIndex(s: BookingStatus) {
  return s === 'Cancelled' ? -1 : STEPS.indexOf(s)
}

function fmtDate(s?: string) {
  if (!s) return '—'
  const d = new Date(s.length === 10 ? s + 'T00:00:00' : s)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtCurrency(n?: number) {
  if (!n) return '—'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// ── Primitive UI helpers ──────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-blue-600">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right">{value ?? '—'}</span>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  )
}

// ── Progress stepper ──────────────────────────────────────────────────────────

function Stepper({ status }: { status: BookingStatus }) {
  const cur = stepIndex(status)

  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
        <XCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <div className="font-bold text-red-700 text-sm">Booking Cancelled</div>
          <div className="text-xs text-red-400 mt-0.5">Contact support if you need to rebook.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {STEPS.map((step, i) => {
        const done   = i < cur
        const active = i === cur
        const last   = i === STEPS.length - 1

        return (
          <div key={step} className="flex gap-4">
            {/* Icon + connector */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                done   ? 'bg-green-500 shadow-sm shadow-green-200' :
                active ? 'bg-amber-400 shadow-md shadow-amber-200 ring-4 ring-amber-50' :
                         'bg-slate-100'
              }`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : active ? (
                  <Clock className="w-4 h-4 text-white animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300" />
                )}
              </div>
              {!last && (
                <div className={`w-0.5 flex-1 min-h-8 my-1 transition-colors duration-300 ${
                  done ? 'bg-green-200' : 'bg-slate-100'
                }`} />
              )}
            </div>

            {/* Label */}
            <div className={`pb-6 pt-1 ${last ? 'pb-0' : ''}`}>
              <div className={`text-sm font-semibold transition-colors ${
                done   ? 'text-green-700' :
                active ? 'text-amber-700' :
                         'text-slate-300'
              }`}>
                {step}
              </div>
              <div className={`text-xs mt-0.5 ${
                done   ? 'text-green-400' :
                active ? 'text-amber-500 font-medium' :
                         'text-slate-200'
              }`}>
                {done ? 'Completed' : active ? 'In Progress' : 'Pending'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <Pulse className="h-5 w-40 mb-5" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Pulse className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 pt-1 space-y-1.5">
                <Pulse className="h-4 w-36" />
                <Pulse className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <Pulse className="h-5 w-36 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between py-2.5">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-32" />
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Invoice print ─────────────────────────────────────────────────────────────

function InvoicePrint({ booking }: { booking: Booking }) {
  const base     = booking.finalAmount || booking.estimatedAmount || 0
  const gst      = Math.round(base * 0.18)
  const total    = base + gst
  const depth    = booking.finalDepth || booking.depth

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice — ${booking.bookingId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 28px; }
  .co-name { font-size: 20px; font-weight: 800; color: #0f172a; }
  .co-meta { color: #64748b; font-size: 12px; margin-top: 4px; }
  .inv-title { font-size: 30px; font-weight: 900; color: #1a56db; }
  .inv-id { color: #64748b; font-size: 12px; margin-top: 4px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .meta-box { background: #f8fafc; border-radius: 8px; padding: 14px; }
  .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.06em; margin-bottom: 6px; }
  .meta-val { font-size: 13px; color: #1e293b; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
  .total-row td { font-weight: 700; background: #f8fafc; font-size: 14px; }
  .grand td { background: #1a56db; color: #fff; font-size: 15px; font-weight: 800; }
  .footer { text-align: center; margin-top: 36px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
</style>
</head><body>
<div class="header">
  <div>
    <div class="co-name">S K Borewells</div>
    <div class="co-meta">+91 83100 08194 &nbsp;|&nbsp; Udupi District, Karnataka</div>
  </div>
  <div style="text-align:right">
    <div class="inv-title">INVOICE</div>
    <div class="inv-id">${booking.bookingId}</div>
  </div>
</div>
<div class="meta-grid">
  <div class="meta-box">
    <div class="meta-label">Bill To</div>
    <div class="meta-val">
      <strong>${booking.customerName}</strong><br/>
      ${booking.mobile}<br/>
      ${booking.address ? booking.address + ',' : ''} ${booking.village}<br/>
      ${booking.pincode || ''}
    </div>
  </div>
  <div class="meta-box">
    <div class="meta-label">Booking Info</div>
    <div class="meta-val">
      <strong>Booking ID:</strong> ${booking.bookingId}<br/>
      <strong>Service:</strong> ${booking.serviceType}<br/>
      <strong>Booking Date:</strong> ${fmtDate(booking.bookingDate)}<br/>
      ${depth ? `<strong>Depth:</strong> ${depth} ft` : ''}
    </div>
  </div>
</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    <tr>
      <td>${booking.serviceType}${depth ? ` — ${depth} ft drilling` : ''}</td>
      <td style="text-align:right">₹${base.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <td>GST @ 18%</td>
      <td style="text-align:right">₹${gst.toLocaleString('en-IN')}</td>
    </tr>
    <tr class="grand">
      <td>Total Amount</td>
      <td style="text-align:right">₹${total.toLocaleString('en-IN')}</td>
    </tr>
  </tbody>
</table>
${booking.waterStrikeLevel ? `<p style="margin-top:16px;font-size:12px;color:#0369a1"><strong>Water Strike Level:</strong> ${booking.waterStrikeLevel}</p>` : ''}
${booking.jobNotes ? `<p style="margin-top:8px;font-size:12px;color:#64748b"><strong>Notes:</strong> ${booking.jobNotes}</p>` : ''}
<div class="footer">Thank you for choosing S K Borewells &nbsp;·&nbsp; +91 83100 08194</div>
</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
    >
      <Printer className="w-4 h-4" />
      Download / Print Invoice
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrackBookingPage() {
  const [input, setInput]         = useState('')
  const [searching, setSearching] = useState(false)
  const [booking, setBooking]     = useState<Booking | null>(null)
  const [notFound, setNotFound]   = useState(false)
  const [inputError, setInputError] = useState('')
  const [recent, setRecent]       = useState<string[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches on mount
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'))
    } catch {}
    inputRef.current?.focus()
  }, [])

  // Auto-refresh every 30 s when a booking is shown
  useEffect(() => {
    if (!booking) return
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API}/bookings/track/${encodeURIComponent(booking.bookingId)}`)
        if (res.ok) {
          setBooking(await res.json())
          setLastUpdated(new Date())
        }
      } catch {}
    }, POLL_MS)
    return () => clearInterval(id)
  }, [booking?.bookingId])

  const addRecent = (id: string) => {
    const next = [id, ...recent.filter(r => r !== id)].slice(0, MAX_RECENT)
    setRecent(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }

  const doSearch = async (id: string) => {
    const q = id.trim().toUpperCase()
    if (!q) { setInputError('Please enter a Booking ID'); return }
    setInputError('')
    setNotFound(false)
    setSearching(true)
    setBooking(null)
    try {
      const res = await fetch(`${API}/bookings/track/${encodeURIComponent(q)}`)
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBooking(data)
      setLastUpdated(new Date())
      addRecent(q)
    } catch {
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(input)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* ── Top nav ── */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-base">S</span>
          </div>
          <div>
            <div className="font-black text-slate-800 text-sm leading-tight">S K Borewells</div>
            <div className="text-xs text-slate-400 leading-tight">Booking Tracker</div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Hero ── */}
        <div className="text-center pt-2 pb-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Track Your Borewell Booking
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Enter your Booking ID to check live status
          </p>
        </div>

        {/* ── Search card ── */}
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="flex gap-2.5">
            <div className="flex-1">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => { setInput(e.target.value.toUpperCase()); setInputError('') }}
                  placeholder="e.g. BWP-A1B2C3"
                  className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    inputError ? 'border-red-300 bg-red-50 placeholder-red-300' : 'border-slate-200 bg-slate-50'
                  }`}
                />
              </div>
              {inputError && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {inputError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={searching}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors shrink-0"
            >
              {searching
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Search className="w-4 h-4" />
              }
              {searching ? 'Searching…' : 'Track'}
            </button>
          </form>

          {/* Recent searches */}
          {recent.length > 0 && !booking && (
            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-semibold mb-2">Recent</p>
              <div className="flex flex-wrap gap-2">
                {recent.map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setInput(id); doSearch(id) }}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg font-mono font-semibold transition-colors"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ── Loading ── */}
        {searching && <LoadingSkeleton />}

        {/* ── Not found ── */}
        {notFound && !searching && (
          <Card className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 mb-1">Booking Not Found</p>
            <p className="text-sm text-slate-400">
              No booking found for <span className="font-mono font-semibold text-slate-600">{input}</span>.
              <br />Please check the ID and try again.
            </p>
          </Card>
        )}

        {/* ── Empty state ── */}
        {!booking && !searching && !notFound && (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Package className="w-10 h-10 text-blue-300" />
            </div>
            <p className="font-bold text-slate-600 text-base mb-1.5">Track Your Booking</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              Enter your Booking ID to get real-time updates on your borewell service.
            </p>
          </Card>
        )}

        {/* ── Booking result ── */}
        {booking && !searching && (
          <div className="space-y-4">

            {/* Status bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <StatusBadge status={booking.status} />
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-xs text-slate-400">
                    Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={() => doSearch(booking.bookingId)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Refresh status"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress stepper */}
            <Card className="p-6">
              <SectionHeading icon={<ChevronRight className="w-4 h-4" />} title="Booking Progress" />
              <Stepper status={booking.status} />
            </Card>

            {/* Customer details */}
            <Card className="p-6">
              <SectionHeading icon={<User className="w-4 h-4" />} title="Customer Details" />
              <Row label="Name"    value={booking.customerName} />
              <Row label="Mobile"  value={booking.mobile} />
              {booking.address && (
                <Row
                  label="Address"
                  value={`${booking.address}${booking.village ? ', ' + booking.village : ''}${booking.pincode ? ' – ' + booking.pincode : ''}`}
                />
              )}
            </Card>

            {/* Booking details */}
            <Card className="p-6">
              <SectionHeading icon={<Hash className="w-4 h-4" />} title="Booking Details" />
              <Row label="Booking ID"    value={<span className="font-mono">{booking.bookingId}</span>} />
              <Row label="Service"       value={booking.serviceType} />
              <Row label="Booking Date"  value={fmtDate(booking.bookingDate)} />
              <Row label="Required Date" value={fmtDate(booking.requiredDate || booking.scheduledDate)} />
              {booking.depth > 0 && <Row label="Selected Depth" value={`${booking.depth} ft`} />}
              <Row label="Est. Amount"   value={fmtCurrency(booking.estimatedAmount)} />
              {booking.notes && <Row label="Notes" value={booking.notes} />}
            </Card>

            {/* Team details */}
            {(booking.assignedTeam || booking.assignedOperator) && (
              <Card className="p-6">
                <SectionHeading icon={<Users className="w-4 h-4" />} title="Assigned Team" />
                {booking.assignedTeam     && <Row label="Team Name"       value={booking.assignedTeam} />}
                {booking.assignedOperator && <Row label="Operator"        value={booking.assignedOperator} />}
                {booking.assignedVehicle  && <Row label="Vehicle No."     value={booking.assignedVehicle} />}
                {booking.scheduledDate    && <Row label="Scheduled Date"  value={fmtDate(booking.scheduledDate)} />}
                {booking.scheduledTime    && <Row label="Scheduled Time"  value={booking.scheduledTime} />}
              </Card>
            )}

            {/* Work details */}
            {(booking.status === 'In Progress' || booking.status === 'Completed') &&
             (booking.finalDepth || booking.waterStrikeLevel || booking.jobNotes) && (
              <Card className="p-6">
                <SectionHeading icon={<Wrench className="w-4 h-4" />} title="Work Details" />
                {booking.finalDepth && (
                  <Row label="Drilling Depth" value={`${booking.finalDepth} ft`} />
                )}
                {booking.waterStrikeLevel && (
                  <Row
                    label="Water Strike"
                    value={
                      <span className="flex items-center gap-1 text-blue-600 font-bold">
                        <Droplets className="w-3.5 h-3.5" />
                        {booking.waterStrikeLevel}
                      </span>
                    }
                  />
                )}
                {booking.jobNotes && <Row label="Work Notes" value={booking.jobNotes} />}
              </Card>
            )}

            {/* Completed summary */}
            {booking.status === 'Completed' && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800 text-sm">Work Completed Successfully!</span>
                </div>
                {booking.finalDepth && (
                  <Row label="Final Depth"   value={`${booking.finalDepth} ft`} />
                )}
                {booking.waterStrikeLevel && (
                  <Row
                    label="Water Strike"
                    value={
                      <span className="flex items-center gap-1 text-blue-600 font-bold">
                        <Droplets className="w-3.5 h-3.5" />{booking.waterStrikeLevel}
                      </span>
                    }
                  />
                )}
                <Row
                  label="Final Amount"
                  value={
                    <span className="text-green-700 font-black text-base">
                      {fmtCurrency(booking.finalAmount || booking.estimatedAmount)}
                    </span>
                  }
                />
                <div className="mt-4 pt-4 border-t border-green-100">
                  <InvoicePrint booking={booking} />
                </div>
              </Card>
            )}

            {/* Support */}
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-700 text-sm">Need Help?</p>
                  <p className="text-xs text-slate-400 mt-0.5">Available 8 AM – 8 PM, 7 days a week</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${COMPANY_PHONE}`}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${COMPANY_WA}?text=${encodeURIComponent(`Hi, I need help with booking ${booking.bookingId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>
            </Card>

            <p className="text-center text-xs text-slate-300 pb-4">
              Status refreshes automatically every 30 seconds
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
