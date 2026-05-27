'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isCustomer, logout, getSession } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api'

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  'Booking Received':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  dot: '#3b82f6', label: 'Booking Received' },
  'Team Assigned':         { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  dot: '#f59e0b', label: 'Team Assigned' },
  'Confirmed & Scheduled': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', dot: '#8b5cf6', label: 'Confirmed' },
  'In Progress':           { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  dot: '#f97316', label: 'In Progress' },
  'Completed':             { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  dot: '#10b981', label: 'Completed' },
  'Cancelled':             { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   dot: '#ef4444', label: 'Cancelled' },
}

const STEPS = ['Booking Received', 'Team Assigned', 'Confirmed & Scheduled', 'In Progress', 'Completed']

interface Booking {
  bookingId: string
  customerName: string
  mobile: string
  serviceType: string
  depth: number
  estimatedAmount: number
  requiredDate: string
  bookingDate: string
  status: string
  village?: string
  pincode?: string
  notes?: string
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { color: '#64748b', bg: 'rgba(100,116,139,0.12)', dot: '#64748b', label: status }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function StepTracker({ status }: { status: string }) {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl text-xs font-semibold"
        style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
        ✕ This booking has been cancelled
      </div>
    )
  }
  const current = STEPS.indexOf(status)
  return (
    <div className="flex items-center mt-3 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done = i <= current
        const active = i === current
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1 px-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: done ? (active ? '#3b82f6' : '#10b981') : 'rgba(255,255,255,0.1)',
                  color: done ? '#fff' : '#64748b',
                  boxShadow: active ? '0 0 0 3px rgba(59,130,246,0.3)' : 'none',
                }}>
                {done && !active ? '✓' : i + 1}
              </div>
              <span className="text-center leading-tight"
                style={{ fontSize: 9, color: active ? '#60a5fa' : done ? '#10b981' : '#475569', whiteSpace: 'nowrap' }}>
                {step.replace('Confirmed & Scheduled', 'Confirmed')}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 w-5 shrink-0 mb-4"
                style={{ background: i < current ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function BookingCard({ b }: { b: Booking }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-400">{b.bookingId}</span>
              <StatusBadge status={b.status} />
            </div>
            <div className="text-white font-bold text-base">{b.serviceType || 'Borewell Drilling'}</div>
            <div className="text-slate-400 text-xs mt-0.5">
              {b.customerName && <span>{b.customerName}</span>}
              {b.village ? ` · ${b.village}${b.pincode ? ` – ${b.pincode}` : ''}` : ''}
              {b.depth ? ` · ${b.depth} ft` : ''}
            </div>
          </div>
          <div className="text-right">
            <div className="text-amber-400 font-black text-lg">{fmt(b.estimatedAmount || 0)}</div>
            <div className="text-slate-500 text-xs">Est. Amount</div>
          </div>
        </div>

        <StepTracker status={b.status} />

        <div className="flex gap-4 mt-3 flex-wrap">
          {b.bookingDate && (
            <div>
              <div className="text-slate-500 text-xs">Booked on</div>
              <div className="text-slate-300 text-xs font-semibold">{fmtDate(b.bookingDate)}</div>
            </div>
          )}
          {b.requiredDate && (
            <div>
              <div className="text-slate-500 text-xs">Service Date</div>
              <div className="text-green-400 text-xs font-semibold">{fmtDate(b.requiredDate)}</div>
            </div>
          )}
        </div>

        <button onClick={() => setExpanded(v => !v)}
          className="mt-3 text-xs font-semibold"
          style={{ color: '#60a5fa' }}>
          {expanded ? '▲ Hide details' : '▼ View full details'}
        </button>
      </div>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {(([
            ['Customer', b.customerName],
            ['Mobile', b.mobile],
            ['Service', b.serviceType],
            ['Depth', b.depth ? `${b.depth} ft` : '—'],
            ['Est. Cost', fmt(b.estimatedAmount || 0)],
            ['Location', b.village || '—'],
            ['Pincode', b.pincode || '—'],
            b.notes ? ['Notes', b.notes] : null,
          ].filter(Boolean)) as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-slate-500 text-xs">{label}</span>
              <span className="text-slate-200 text-xs font-medium text-right">{value}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-2 flex-wrap">
            <button
              onClick={() => window.open(`https://wa.me/918310008194?text=${encodeURIComponent(`Hi, I need help with booking ${b.bookingId}`)}`, '_blank')}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(37,211,102,0.15)', color: '#4ade80', border: '1px solid rgba(37,211,102,0.3)' }}>
              💬 WhatsApp
            </button>
            <button onClick={() => window.open('tel:+918310008194')}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.12)' }}>
              📞 Call Us
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 animate-pulse"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="h-3 rounded w-32 mb-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
      <div className="h-5 rounded w-48 mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-3 rounded w-64 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="flex gap-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-2 w-10 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MyBookings() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  const fetchBookings = useCallback(async (customerEmail: string) => {
    if (!customerEmail) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/bookings/by-email/${encodeURIComponent(customerEmail)}`)
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      setError('Could not load bookings. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    if (!isCustomer()) { router.replace('/dashboard'); return }
    const s = getSession()
    const customerEmail = s?.email || ''
    if (customerEmail) setEmail(customerEmail)
    fetchBookings(customerEmail)
  }, [router, fetchBookings])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)' }}>

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/customer-dashboard')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ←
          </button>
          <div>
            <div className="text-white font-black text-base leading-tight">My Bookings</div>
            {email && <div className="text-blue-400 text-xs">{email}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchBookings(email)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
            ↻ Refresh
          </button>
          <button onClick={() => { logout(); router.push('/login') }}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="h-6 w-40 rounded mb-6" style={{ background: 'rgba(255,255,255,0.07)' }} />
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl p-4 text-sm mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            ⚠️ {error}
            <button onClick={() => fetchBookings(email)} className="ml-3 underline text-xs">Retry</button>
          </div>
        )}

        {/* Bookings list */}
        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-bold text-base">
                {bookings.length} Booking{bookings.length !== 1 ? 's' : ''}
              </h2>
            </div>
            {bookings.map(b => <BookingCard key={b.bookingId} b={b} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-5xl mb-4">📭</div>
            <div className="text-white font-bold text-lg mb-2">No bookings found</div>
            <p className="text-slate-400 text-sm">No bookings are linked to <span className="text-blue-400">{email}</span>. Make sure you enter this email when placing a booking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
