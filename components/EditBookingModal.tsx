'use client'
import { useState, useEffect } from 'react'
import type { Booking } from '@/lib/types'
import { updateBooking } from '@/lib/storage'
import { X, Save } from 'lucide-react'

interface Props {
  booking: Booking | null
  onClose: () => void
  onUpdate: () => void
}

const SERVICES = [
  'Residential Borewell', 'Commercial Borewell', 'Agricultural Borewell',
  'Borewell Deepening', 'Borewell Repair', 'Pump Installation',
]

export default function EditBookingModal({ booking, onClose, onUpdate }: Props) {
  const [form, setForm] = useState<Partial<Booking>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (booking) setForm({ ...booking })
  }, [booking])

  if (!booking) return null

  const update = (key: keyof Booking, val: string | number) =>
    setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    await updateBooking(booking.bookingId, form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onUpdate()
      onClose()
    }, 800)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-blue-900 text-white shrink-0">
            <div>
              <div className="font-bold text-lg">Edit Booking</div>
              <div className="text-blue-200 text-sm">{booking.bookingId}</div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-6 space-y-5">

            {/* Customer Details */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Customer Details</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Customer Name">
                  <input value={form.customerName || ''} onChange={e => update('customerName', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Mobile Number">
                  <input value={form.mobile || ''} onChange={e => update('mobile', e.target.value)} maxLength={10} className={inputCls} />
                </Field>
                <Field label="Alternate Number">
                  <input value={form.altMobile || ''} onChange={e => update('altMobile', e.target.value)} maxLength={10} className={inputCls} placeholder="Optional" />
                </Field>
                <Field label="Pincode">
                  <input value={form.pincode || ''} onChange={e => update('pincode', e.target.value)} maxLength={6} className={inputCls} />
                </Field>
                <Field label="Address" full>
                  <input value={form.address || ''} onChange={e => update('address', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Village / City">
                  <input value={form.village || ''} onChange={e => update('village', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Service Details */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Service Details</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Service Type" full>
                  <select value={form.serviceType || ''} onChange={e => update('serviceType', e.target.value)} className={inputCls}>
                    <option value="">Select service...</option>
                    {SERVICES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Depth (ft)">
                  <input type="number" value={form.depth || ''} onChange={e => update('depth', Number(e.target.value))} className={inputCls} placeholder="e.g. 400" />
                </Field>
                <Field label="Estimated Amount (₹)">
                  <input type="number" value={form.estimatedAmount || ''} onChange={e => update('estimatedAmount', Number(e.target.value))} className={inputCls} />
                </Field>
                <Field label="Booking Date">
                  <input type="date" value={form.bookingDate || ''} onChange={e => update('bookingDate', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Notes" full>
                  <textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Any notes..." />
                </Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const inputCls = 'w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
