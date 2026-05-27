'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isCustomer, logout, getSession } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api'
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918310008194'

interface Booking {
  bookingId: string
  customerName: string
  mobile: string
  address?: string
  village?: string
  pincode?: string
  serviceType?: string
  requiredDate?: string
  depth?: number
}

function buildConfirmMessage(b: Booking): string {
  const dateLabel = b.requiredDate
    ? new Date(b.requiredDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const lines = [
    'Hello S K Borewells Team,',
    '',
    'I would like to confirm my borewell booking.',
    '',
    '*Booking Details:*',
    `• Booking ID    : ${b.bookingId}`,
    `• Customer Name : ${b.customerName}`,
    `• Mobile Number : ${b.mobile}`,
  ]
  const addr = [b.address, b.village].filter(Boolean).join(', ')
  if (addr)          lines.push(`• Address       : ${addr}`)
  if (b.pincode)     lines.push(`• Pincode       : ${b.pincode}`)
  if (b.serviceType) lines.push(`• Service Type  : ${b.serviceType}`)
  if (dateLabel)     lines.push(`• Required Date : ${dateLabel}`)
  if (b.depth)       lines.push(`• Est. Depth    : ${b.depth} ft`)
  lines.push('', 'Please confirm my booking.', '', 'Thank You.')
  return lines.join('\n')
}

function openWhatsApp(booking: Booking | null) {
  const url = booking
    ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildConfirmMessage(booking))}`
    : `https://wa.me/${WA_NUMBER}`
  window.open(url, '_blank')
}

const FEATURES = [
  {
    icon: '📊',
    title: 'Get Instant Quote',
    desc: 'Transparent, itemized borewell quote in under 30 seconds.',
    action: 'Get Quote →',
    href: '/book',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.12)',
    border: 'rgba(217,119,6,0.3)',
  },
  {
    icon: '📦',
    title: 'Track My Booking',
    desc: 'Check real-time status of your drilling booking anytime.',
    action: 'Track Now →',
    href: '/my-bookings',
    color: '#059669',
    bg: 'rgba(5,150,105,0.12)',
    border: 'rgba(5,150,105,0.3)',
  },
  {
    icon: '💬',
    title: 'WhatsApp Support',
    desc: 'Chat with our team for instant booking confirmation.',
    action: 'Open WhatsApp →',
    href: 'https://wa.me/918310008194',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.12)',
    border: 'rgba(22,163,74,0.3)',
  },
  {
    icon: '🧾',
    title: 'View Invoice',
    desc: 'Download GST invoices for your completed borewell service.',
    action: 'View Invoice →',
    href: '/my-bookings',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.3)',
  },
  {
    icon: '📞',
    title: 'Call Support',
    desc: 'Speak with drilling experts. Available 8 AM – 8 PM.',
    action: 'Call Now →',
    href: 'tel:+918310008194',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.12)',
    border: 'rgba(8,145,178,0.3)',
  },
  {
    icon: '🗺️',
    title: 'Service Areas',
    desc: 'Serving all districts across Karnataka — residential & agricultural.',
    action: 'View Areas →',
    href: 'https://wa.me/918310008194',
    color: '#e11d48',
    bg: 'rgba(225,29,72,0.12)',
    border: 'rgba(225,29,72,0.3)',
  },
]

export default function CustomerDashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('Customer')
  const [visible, setVisible] = useState(false)
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    if (!isCustomer()) { router.replace('/dashboard'); return }
    const s = getSession()
    if (s) {
      setUsername(s.username.charAt(0).toUpperCase() + s.username.slice(1))
      if (s.email) {
        fetch(`${API}/bookings/by-email/${encodeURIComponent(s.email)}`)
          .then(r => r.json())
          .then((data: Booking[]) => { if (data?.length) setLatestBooking(data[0]) })
          .catch(() => {})
      }
    }
    setTimeout(() => setVisible(true), 50)
  }, [router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleNav = (href: string) => {
    if (href.startsWith('https://wa')) {
      openWhatsApp(latestBooking)
    } else if (href.startsWith('http') || href.startsWith('tel:')) {
      window.open(href, '_blank')
    } else {
      router.push(href)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)' }}>

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>⛏️</div>
          <div>
            <div className="text-white font-black text-base leading-tight">S K Borewells</div>
            <div className="text-blue-400 text-xs">Customer Portal</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-white text-sm font-medium">{username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
          >
            ↩ Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-16">

        {/* Greeting */}
        <div className="pt-10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            👋 Welcome back
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Hello, {username}!</h1>
          <p className="text-slate-400 text-base">Manage your borewell bookings, track progress, and get instant quotes.</p>
        </div>

        {/* ── PRIMARY BOOK NOW CTA ── */}
        <div className="mb-8 rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#2563eb 100%)', border: '1px solid rgba(96,165,250,0.3)' }}>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏗️</span>
                <span className="text-white font-black text-xl">Book Borewell Service</span>
              </div>
              <p className="text-blue-200 text-sm leading-relaxed max-w-md">
                Get an instant quote and book certified drilling experts for residential,
                commercial & agricultural borewells across Karnataka.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {['DTH Drilling', 'Rotary Drilling', 'Water Survey', 'Casing & Pump'].map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#bfdbfe' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => router.push('/book')}
              className="shrink-0 flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#0f172a', boxShadow: '0 8px 24px rgba(251,191,36,0.4)', minWidth: 180 }}
            >
              📅 Book Now
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <h2 className="text-white font-bold text-base mb-4 opacity-70 uppercase tracking-widest text-xs">More options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <button
              key={f.title}
              onClick={() => handleNav(f.href)}
              className="text-left rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: f.bg,
                border: `1px solid ${f.border}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`,
              }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="text-white font-bold text-base mb-1.5">{f.title}</div>
              <div className="text-slate-400 text-sm mb-4 leading-relaxed">{f.desc}</div>
              <div className="text-sm font-bold" style={{ color: f.color }}>{f.action}</div>
            </button>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-8 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <div className="text-white font-bold text-sm">Need Help? Call Us</div>
              <div className="text-slate-400 text-xs mt-0.5">Available 8 AM – 8 PM, 7 days a week</div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => window.open('tel:+918310008194')}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              📞 +91 83100 08194
            </button>
            <button
              onClick={() => openWhatsApp(latestBooking)}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(37,211,102,0.15)', color: '#4ade80', border: '1px solid rgba(37,211,102,0.3)' }}
            >
              💬 WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
