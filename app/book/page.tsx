'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isCustomer, logout, getSession } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api'

// ── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  { id: 'residential',  name: 'Residential Borewell', icon: '🏠', desc: 'For homes & apartments',    pricePerFoot: 125, minDepth: 200, maxDepth: 1200, defaultDepth: 400 },
  { id: 'commercial',   name: 'Commercial Borewell',  icon: '🏢', desc: 'For offices & factories',  pricePerFoot: 125, minDepth: 200, maxDepth: 1200, defaultDepth: 400 },
  { id: 'agricultural', name: 'Agricultural Borewell',icon: '🌾', desc: 'For farms & irrigation',   pricePerFoot: 125, minDepth: 200, maxDepth: 1200, defaultDepth: 400 },
  { id: 'deepening',    name: 'Borewell Deepening',   icon: '⬇️', desc: 'Extend existing borewell', pricePerFoot: 125, minDepth: 200, maxDepth: 1200, defaultDepth: 400 },
  { id: 'repair',       name: 'Borewell Repair',      icon: '🔧', desc: 'Repair & maintenance',     pricePerFoot: 0,   flatFee: 5000,  minDepth: 0,   maxDepth: 0,    defaultDepth: 0 },
  { id: 'pump',         name: 'Pump Installation',    icon: '💧', desc: 'Submersible pump setup',   pricePerFoot: 0,   flatFee: 18000, minDepth: 0,   maxDepth: 0,    defaultDepth: 0 },
]

const DRILLING_TIERS = [
  { max: 400, rate: 125 }, { max: 500, rate: 135 }, { max: 600, rate: 145 },
  { max: 700, rate: 155 }, { max: 800, rate: 165 }, { max: 900, rate: 175 },
  { max: Infinity, rate: 185 },
]
const GST = 0.18
const CASING_PER_FOOT = 600
const PIPE_LEN = 20
const SETTING = 2500, END_CAP = 500, COUPLING = 500, WELDING = 500, RIPPLE = 2500

const UDUPI_PREFIXES = ['574', '576']

const NOTES = [
  'Above 400 ft drilling charges increase by ₹10/ft in steps (₹125 → ₹185 above 900 ft).',
  'If borewell goes dry, only drilling + welding + setting charges will be billed.',
  '10" PVC outer pipe (if required): ₹950/ft additional.',
  '18% GST is included in the above estimate.',
  'Payment must be made immediately after completion of work.',
  'Cost varies with actual depth drilled and length of casing installed.',
  'We are not responsible for yield, water quality, or texture.',
]

// ── Calculator ────────────────────────────────────────────────────────────────

interface Service {
  id: string; name: string; icon: string; desc: string
  pricePerFoot: number; minDepth: number; maxDepth: number; defaultDepth: number
  flatFee?: number
}

interface Quote {
  service: string; depth: number; nos: number
  drillingCost: number; casingCost: number; settingCharges: number
  endCap: number; couplingCharges: number; weldingCharges: number
  waterRipple: number; subtotal: number; gst: number; total: number
  advanceAmount: number
}

function calcDrilling(depth: number) {
  let cost = 0, prev = 0
  for (const t of DRILLING_TIERS) {
    if (depth <= prev) break
    const feet = Math.min(depth, t.max === Infinity ? depth : t.max) - prev
    cost += feet * t.rate
    prev = t.max === Infinity ? depth : t.max
  }
  return cost
}

function calcQuote(service: Service, depth: number): Quote {
  if (service.flatFee) {
    const gst = service.flatFee * GST
    const total = service.flatFee + gst
    return {
      service: service.name, depth: 0, nos: 0,
      drillingCost: service.flatFee, casingCost: 0, settingCharges: 0,
      endCap: 0, couplingCharges: 0, weldingCharges: 0, waterRipple: 0,
      subtotal: service.flatFee, gst: Math.round(gst), total: Math.round(total),
      advanceAmount: Math.max(Math.round(total * 0.2 / 100) * 100, 5000),
    }
  }
  const drill = calcDrilling(depth)
  const casing = CASING_PER_FOOT * depth
  const nos = Math.ceil(depth / PIPE_LEN)
  const subtotal = drill + casing + SETTING + END_CAP + nos * COUPLING + nos * WELDING + RIPPLE
  const gst = subtotal * GST
  const total = subtotal + gst
  return {
    service: service.name, depth, nos,
    drillingCost: Math.round(drill), casingCost: Math.round(casing),
    settingCharges: SETTING, endCap: END_CAP,
    couplingCharges: nos * COUPLING, weldingCharges: nos * WELDING, waterRipple: RIPPLE,
    subtotal: Math.round(subtotal), gst: Math.round(gst), total: Math.round(total),
    advanceAmount: Math.max(Math.round(total * 0.2 / 100) * 100, 5000),
  }
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function generateBookingId() {
  return `BWP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

// ── Availability ──────────────────────────────────────────────────────────────

interface Avail { loading: boolean; remaining: number; blocked: boolean }

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BookPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'service' | 'depth' | 'quote' | 'form' | 'success'>('service')

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [depth, setDepth] = useState(400)
  const [quote, setQuote] = useState<Quote | null>(null)

  const [form, setForm] = useState({ name: '', mobile: '', altMobile: '', email: '', address: '', village: '', pincode: '', requiredDate: '', notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [avail, setAvail] = useState<Avail>({ loading: false, remaining: 0, blocked: false })
  const [successId, setSuccessId] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    if (!isCustomer()) { router.replace('/dashboard'); return }
    const s = getSession()
    if (s?.email) {
      setEmail(s.email)
      setForm(f => ({ ...f, email: s.email! }))
    }
  }, [router])

  // Check availability when date changes
  useEffect(() => {
    if (!form.requiredDate) return
    setAvail(a => ({ ...a, loading: true }))
    // Clear any previous booking-limit error when date changes
    setErrors(e => { const n = { ...e }; delete n.requiredDate; return n })
    fetch(`${API}/booking-count/${form.requiredDate}`)
      .then(r => r.json())
      .then(d => {
        const remaining = d.remaining ?? 0
        setAvail({ loading: false, remaining, blocked: !!d.blocked })
        if (remaining === 0 || d.blocked) {
          setErrors(e => ({ ...e, requiredDate: 'This date is fully booked. Please choose another date.' }))
        } else {
          setErrors(e => { const n = { ...e }; delete n.requiredDate; return n })
        }
      })
      .catch(() => setAvail({ loading: false, remaining: 0, blocked: false }))
  }, [form.requiredDate])

  const chooseService = (s: Service) => {
    setSelectedService(s)
    setDepth(s.defaultDepth || 400)
    if (s.flatFee) {
      const q = calcQuote(s, 0)
      setQuote(q)
      setStep('quote')
    } else {
      setStep('depth')
    }
  }

  const confirmDepth = () => {
    if (!selectedService) return
    setQuote(calcQuote(selectedService, depth))
    setStep('quote')
  }

  const update = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Enter valid 10-digit mobile'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter valid email'
    if (!form.address.trim()) e.address = 'Address is required'
    if (!form.village.trim()) e.village = 'Village / City is required'
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter valid 6-digit pincode'
    else if (!UDUPI_PREFIXES.some(p => form.pincode.startsWith(p))) e.pincode = 'We currently serve Udupi district only.'
    if (!form.requiredDate) e.requiredDate = 'Select a date'
    else if (!avail.loading && (avail.remaining === 0 || avail.blocked)) e.requiredDate = 'This date is fully booked.'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    const bookingId = generateBookingId()
    const booking = {
      id: bookingId, bookingId,
      customerName: form.name,
      mobile: form.mobile,
      altMobile: form.altMobile || '',
      email: form.email.trim().toLowerCase(),
      address: form.address,
      village: form.village,
      pincode: form.pincode,
      serviceType: selectedService?.name || '',
      depth: quote?.depth || 0,
      estimatedAmount: quote?.total || 0,
      bookingDate: new Date().toISOString().split('T')[0],
      requiredDate: form.requiredDate,
      notes: form.notes || '',
      status: 'Booking Received',
    }
    try {
      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          setErrors({ requiredDate: data.message || 'This date is fully booked. Please choose another date.' })
          setAvail({ loading: false, remaining: 0, blocked: false })
        } else {
          const detail = data.details ? ` (${data.details})` : ''
          setErrors({ form: (data.error || 'Something went wrong. Please try again.') + detail })
        }
        setSubmitting(false)
        return
      }
    } catch {
      // server down — proceed
    }
    setSuccessId(bookingId)
    setSubmitting(false)
    setStep('success')
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)' }}>

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => step === 'service' ? router.push('/customer-dashboard') : setStep(step === 'depth' ? 'service' : step === 'quote' ? (selectedService?.flatFee ? 'service' : 'depth') : step === 'form' ? 'quote' : 'service')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ←
          </button>
          <div>
            <div className="text-white font-black text-base leading-tight">
              {step === 'service' ? 'Book a Service' : step === 'depth' ? 'Configure Depth' : step === 'quote' ? 'Your Quote' : step === 'form' ? 'Confirm Booking' : 'Booking Confirmed'}
            </div>
            {email && <div className="text-blue-400 text-xs">{email}</div>}
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/login') }}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
          Logout
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── STEP: Service Selection ─────────────────────────────── */}
        {step === 'service' && (
          <div>
            <div className="mb-6">
              <h2 className="text-white font-black text-2xl mb-1">Select Service</h2>
              <p className="text-slate-400 text-sm">Choose the borewell service that fits your requirement</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map(s => (
                <button key={s.id} onClick={() => chooseService(s)}
                  className="text-left p-4 rounded-2xl transition-all hover:scale-[1.03]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-white font-bold text-sm leading-tight mb-1">{s.name}</div>
                  <div className="text-slate-500 text-xs mb-2">{s.desc}</div>
                  <div className="text-amber-400 text-xs font-bold">
                    {s.pricePerFoot ? `From ₹${s.pricePerFoot}/ft` : s.flatFee ? `Fixed: ${fmt(s.flatFee)}` : 'Custom Quote'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: Depth Configuration ───────────────────────────── */}
        {step === 'depth' && selectedService && (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{selectedService.icon}</span>
                <h2 className="text-white font-black text-xl">{selectedService.name}</h2>
              </div>
              <p className="text-slate-400 text-sm">Adjust the depth to get your estimate</p>
            </div>

            <div className="rounded-2xl p-6 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-center mb-6">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Required Depth</div>
                <div className="text-5xl font-black text-white">{depth}</div>
                <div className="text-slate-400 text-sm mt-1">feet</div>
              </div>
              <input type="range"
                min={selectedService.minDepth} max={selectedService.maxDepth} step={10}
                value={depth}
                onChange={e => setDepth(Number(e.target.value))}
                className="w-full accent-amber-400"
                style={{ height: 6 }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>{selectedService.minDepth} ft</span>
                <span>{selectedService.maxDepth} ft</span>
              </div>

              <div className="mt-5 p-4 rounded-xl text-sm" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="text-slate-400 text-xs mb-1">Estimated cost at {depth} ft</div>
                <div className="text-amber-400 font-black text-xl">{fmt(calcQuote(selectedService, depth).total)}</div>
                <div className="text-slate-500 text-xs mt-0.5">includes GST @ 18%</div>
              </div>
            </div>

            <button onClick={confirmDepth}
              className="w-full py-4 rounded-2xl font-black text-base"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#0f172a' }}>
              View Detailed Quote →
            </button>
          </div>
        )}

        {/* ── STEP: Quote ─────────────────────────────────────────── */}
        {step === 'quote' && quote && (
          <div>
            <div className="mb-5">
              <h2 className="text-white font-black text-2xl mb-1">Your Instant Quote</h2>
              <p className="text-slate-400 text-sm">Real-time estimate based on your selection</p>
            </div>

            {/* Total card */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a56db)', border: '1px solid rgba(96,165,250,0.3)' }}>
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="text-blue-300 text-xs uppercase tracking-wider mb-1">Total Estimated Cost</div>
                  <div className="text-white font-black text-3xl">{fmt(quote.total)}</div>
                  <div className="text-blue-300 text-xs mt-1">Includes GST @ 18%</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-300 text-xs uppercase tracking-wider mb-1">Service</div>
                  <div className="text-white font-bold">{quote.service}</div>
                  {quote.depth > 0 && <div className="text-blue-200 text-sm mt-1">Depth: {quote.depth} ft</div>}
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.25)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Advance to Confirm</span>
                  <span className="text-white font-bold">{fmt(quote.advanceAmount)}</span>
                </div>
                <div className="text-blue-300 text-xs mt-1">~20% of total · Balance at completion</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl p-5 mb-4 space-y-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-white font-bold text-sm mb-3">Cost Breakdown</div>
              {(([
                quote.drillingCost > 0 ? [`6½" Borewell Drilling (${quote.depth} ft)`, quote.drillingCost] : null,
                quote.casingCost > 0 ? [`7" GI Casing Pipe "B" (${quote.depth} ft × ₹600)`, quote.casingCost] : null,
                quote.settingCharges > 0 ? ['Setting Charges', quote.settingCharges] : null,
                quote.endCap > 0 ? ['End Cap of Casing Pipe', quote.endCap] : null,
                quote.couplingCharges > 0 ? [`Coupling Charges (${quote.nos} nos × ₹500)`, quote.couplingCharges] : null,
                quote.weldingCharges > 0 ? [`Welding Charges (${quote.nos} nos × ₹500)`, quote.weldingCharges] : null,
                quote.waterRipple > 0 ? ['Water Ripple (dust control)', quote.waterRipple] : null,
              ].filter(Boolean)) as [string, number][]).map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-200 font-medium">{fmt(val)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sub Total</span>
                  <span className="text-slate-200">{fmt(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">GST (18%)</span>
                  <span className="text-slate-200">{fmt(quote.gst)}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-1">
                  <span className="text-white">Total Payable</span>
                  <span className="text-amber-400">{fmt(quote.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="text-amber-400 font-bold text-xs mb-2">📋 Important Notes</div>
              <ul className="space-y-1.5 pl-4">
                {NOTES.map((n, i) => <li key={i} className="text-slate-400 text-xs list-disc">{n}</li>)}
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('form')}
                className="flex-1 py-4 rounded-2xl font-black text-base transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#0f172a', boxShadow: '0 8px 24px rgba(251,191,36,0.35)' }}>
                📅 Book Now
              </button>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500 justify-center">
              <span>✅ No hidden charges</span>
              <span>✅ GST Invoice provided</span>
              <span>✅ Certified team</span>
            </div>
          </div>
        )}

        {/* ── STEP: Booking Form ───────────────────────────────────── */}
        {step === 'form' && (
          <div>
            <div className="mb-6">
              <h2 className="text-white font-black text-xl mb-1">Confirm Your Booking</h2>
              <p className="text-slate-400 text-sm">Fill in your details to book the service</p>
            </div>

            {/* Summary pill */}
            {quote && (
              <div className="rounded-xl px-4 py-3 mb-5 flex justify-between items-center"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a56db)', border: '1px solid rgba(96,165,250,0.3)' }}>
                <div>
                  <div className="text-blue-200 text-xs">{quote.service}{quote.depth ? ` · ${quote.depth} ft` : ''}</div>
                  <div className="text-white font-bold text-sm mt-0.5">Est. {fmt(quote.total)}</div>
                </div>
                <button onClick={() => setStep('quote')} className="text-blue-300 text-xs underline">Edit</button>
              </div>
            )}

            <div className="space-y-4">

              {/* Customer name */}
              <FormField label="Customer Name" required error={errors.name}>
                <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${errors.name ? '#ef4444' : 'rgba(255,255,255,0.12)'}` }}
                  placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                {/* Mobile */}
                <FormField label="Mobile" required error={errors.mobile}>
                  <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${errors.mobile ? '#ef4444' : 'rgba(255,255,255,0.12)'}` }}
                    placeholder="10-digit" maxLength={10} value={form.mobile}
                    onChange={e => update('mobile', e.target.value.replace(/\D/g, ''))} />
                </FormField>
                {/* Alt mobile */}
                <FormField label="Alt. Mobile" error={errors.altMobile}>
                  <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    placeholder="Optional" maxLength={10} value={form.altMobile}
                    onChange={e => update('altMobile', e.target.value.replace(/\D/g, ''))} />
                </FormField>
              </div>

              {/* Email (pre-filled & read-only) */}
              <FormField label="Email Address" required error={errors.email}>
                <input className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.email ? '#ef4444' : 'rgba(255,255,255,0.08)'}`, color: '#60a5fa', cursor: 'not-allowed' }}
                  value={form.email} readOnly />
              </FormField>

              {/* Address */}
              <FormField label="Full Address" required error={errors.address}>
                <textarea className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${errors.address ? '#ef4444' : 'rgba(255,255,255,0.12)'}` }}
                  rows={2} placeholder="House no., Street, Landmark..." value={form.address}
                  onChange={e => update('address', e.target.value)} />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                {/* Village */}
                <FormField label="Village / City" required error={errors.village}>
                  <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${errors.village ? '#ef4444' : 'rgba(255,255,255,0.12)'}` }}
                    placeholder="Village or city" value={form.village}
                    onChange={e => update('village', e.target.value)} />
                </FormField>
                {/* Pincode */}
                <FormField label="Pincode" required error={errors.pincode}>
                  <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${errors.pincode ? '#ef4444' : 'rgba(255,255,255,0.12)'}` }}
                    placeholder="6-digit" maxLength={6} value={form.pincode}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '')
                      update('pincode', v)
                      if (v.length === 6 && !UDUPI_PREFIXES.some(p => v.startsWith(p))) {
                        setErrors(er => ({ ...er, pincode: 'We currently serve Udupi district only.' }))
                      }
                    }} />
                </FormField>
              </div>

              {/* Required date */}
              <FormField label="Required Date" required error={errors.requiredDate}>
                <input type="date" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${errors.requiredDate ? '#ef4444' : 'rgba(255,255,255,0.12)'}`, colorScheme: 'dark' }}
                  min={new Date().toISOString().split('T')[0]}
                  value={form.requiredDate} onChange={e => update('requiredDate', e.target.value)} />
                {form.requiredDate && !avail.loading && (
                  <div className="mt-1.5 text-xs font-semibold"
                    style={{ color: avail.blocked || avail.remaining === 0 ? '#f87171' : avail.remaining === 1 ? '#fbbf24' : '#34d399' }}>
                    {avail.blocked ? '⚠ Date blocked' : avail.remaining === 0 ? '⚠ Fully booked' : avail.remaining === 1 ? '⚠ Only 1 slot remaining' : `✓ ${avail.remaining} slots available`}
                  </div>
                )}
              </FormField>

              {/* Notes */}
              <FormField label="Additional Notes" error={errors.notes}>
                <textarea className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  rows={2} placeholder="Any special requirements..." value={form.notes}
                  onChange={e => update('notes', e.target.value)} />
              </FormField>

            </div>

            {errors.form && (
              <div className="mt-4 px-4 py-3 rounded-xl text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                ⚠ {errors.form}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || avail.loading}
              className="mt-4 w-full py-4 rounded-2xl font-black text-base transition-all"
              style={{ background: (submitting || avail.loading) ? 'rgba(251,191,36,0.5)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#0f172a', opacity: (submitting || avail.loading) ? 0.7 : 1 }}>
              {avail.loading ? '⏳ Checking availability...' : submitting ? '⏳ Processing...' : '✅ Confirm Booking'}
            </button>
          </div>
        )}

        {/* ── STEP: Success ────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-white font-black text-2xl mb-2">Booking Confirmed!</h2>
            <p className="text-slate-400 text-sm mb-5">Your booking has been received. Our team will contact you shortly.</p>
            <div className="inline-block px-5 py-3 rounded-xl mb-6"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="text-slate-400 text-xs mb-1">Booking ID</div>
              <div className="text-white font-black text-lg tracking-wider">{successId}</div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push('/my-bookings')}
                className="w-full py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                📦 View My Bookings
              </button>
              <button onClick={() => { setStep('service'); setSelectedService(null); setQuote(null); setForm(f => ({ ...f, name: '', mobile: '', altMobile: '', address: '', village: '', pincode: '', requiredDate: '', notes: '' })) }}
                className="w-full py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                + New Booking
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-semibold mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <div className="mt-1 text-red-400 text-xs">⚠ {error}</div>}
    </div>
  )
}
