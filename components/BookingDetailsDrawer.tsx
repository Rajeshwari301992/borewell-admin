'use client'
import { useState, useEffect } from 'react'
import type { Booking, BookingStatus } from '@/lib/types'
import { updateBookingStatus } from '@/lib/storage'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  buildTeamAssignedMessage,
  buildScheduleConfirmedMessage,
  buildWorkStartedMessage,
  buildWorkCompletedMessage,
  buildCancelledMessage,
  openWhatsAppToCustomer,
} from '@/lib/whatsapp'
import StatusBadge from './StatusBadge'
import { X, User, Settings, Wrench, CheckCircle, XCircle, Play, CalendarCheck, Users, Pencil, MessageCircle } from 'lucide-react'

interface Props {
  booking: Booking | null
  onClose: () => void
  onUpdate: () => void
  onEdit?: (b: Booking) => void
}

export default function BookingDetailsDrawer({ booking, onClose, onUpdate, onEdit }: Props) {
  const [assignTeam, setAssignTeam] = useState('')
  const [assignOperator, setAssignOperator] = useState('')
  const [assignVehicle, setAssignVehicle] = useState('')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [slotError, setSlotError] = useState('')

  // Reset time + fetch booked slots whenever date changes
  useEffect(() => {
    setSchedTime('')
    setSlotError('')
    if (!schedDate) { setBookedSlots([]); return }
    fetch(`/api/booked-slots/${schedDate}`)
      .then(r => r.json())
      .then(setBookedSlots)
      .catch(() => setBookedSlots([]))
  }, [schedDate])

  // Reset all state when a new booking opens
  useEffect(() => {
    setSchedDate('')
    setSchedTime('')
    setBookedSlots([])
    setSlotError('')
  }, [booking?.bookingId])
  const [showReschedule, setShowReschedule] = useState(false)
  const [reschedDate, setReschedDate] = useState('')
  const [reschedTime, setReschedTime] = useState('')
  const [reschedSlots, setReschedSlots] = useState<string[]>([])
  const [reschedError, setReschedError] = useState('')
  const [finalDepth, setFinalDepth] = useState('')
  const [waterStrike, setWaterStrike] = useState('')
  const [finalAmount, setFinalAmount] = useState('')
  const [jobNotes, setJobNotes] = useState('')

  useEffect(() => {
    setReschedTime('')
    setReschedError('')
    if (!reschedDate) { setReschedSlots([]); return }
    fetch(`/api/booked-slots/${reschedDate}`)
      .then(r => r.json())
      .then(setReschedSlots)
      .catch(() => setReschedSlots([]))
  }, [reschedDate])

  useEffect(() => {
    setShowReschedule(false)
    setReschedDate('')
    setReschedTime('')
    setReschedSlots([])
    setReschedError('')
  }, [booking?.bookingId])

  if (!booking) return null

  const act = async (status: BookingStatus, extra?: Partial<Booking>) => {
    await updateBookingStatus(booking.bookingId, status, extra)
    onUpdate()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-blue-900 text-white shrink-0">
          <div>
            <div className="font-bold text-lg">{booking.bookingId}</div>
            <div className="text-blue-200 text-sm">{booking.customerName}</div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />
            <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Section icon={<User className="w-4 h-4" />} title="Customer Details">
            <Row label="Name" value={booking.customerName} />
            <Row label="Mobile" value={booking.mobile} />
            <Row label="Alternate" value={booking.altMobile || '—'} />
            <Row label="Address" value={booking.address} />
            <Row label="Village/City" value={booking.village} />
            <Row label="Pincode" value={booking.pincode} />
          </Section>

          <Section icon={<Settings className="w-4 h-4" />} title="Service Details">
            <Row label="Service" value={booking.serviceType} />
            <Row label="Depth" value={booking.depth ? `${booking.depth} ft` : '—'} />
            <Row label="Est. Amount" value={formatCurrency(booking.estimatedAmount)} />
            <Row label="Booking Date" value={formatDate(booking.bookingDate)} />
            {booking.notes && <Row label="Notes" value={booking.notes} />}
          </Section>

          {(booking.finalDepth || booking.waterStrikeLevel) && (
            <Section icon={<Wrench className="w-4 h-4" />} title="Job Details">
              {booking.finalDepth && <Row label="Final Depth" value={`${booking.finalDepth} ft`} />}
              {booking.waterStrikeLevel && <Row label="Water Strike" value={booking.waterStrikeLevel} />}
              {booking.finalAmount && <Row label="Final Amount" value={formatCurrency(booking.finalAmount)} />}
              {booking.jobNotes && <Row label="Job Notes" value={booking.jobNotes} />}
            </Section>
          )}

          {booking.status === 'Booking Received' && (
            <Section icon={<Users className="w-4 h-4" />} title="Assign Team">
              <Input label="Team Name" value={assignTeam} onChange={setAssignTeam} placeholder="e.g. Team Alpha" />
              <Input label="Operator" value={assignOperator} onChange={setAssignOperator} placeholder="Operator name" />
              <Input label="Vehicle No." value={assignVehicle} onChange={setAssignVehicle} placeholder="e.g. KA-01-AB-1234" />
              <ActionBtn color="yellow" onClick={() => act('Team Assigned', { assignedTeam: assignTeam, assignedOperator: assignOperator, assignedVehicle: assignVehicle })}>
                Assign Team
              </ActionBtn>
            </Section>
          )}

          {booking.status === 'Team Assigned' && (
            <Section icon={<CalendarCheck className="w-4 h-4" />} title="Confirm Schedule">
              {booking.assignedTeam && <Row label="Team" value={booking.assignedTeam} />}
              <Input label="Service Date" value={schedDate} onChange={setSchedDate} type="date" />
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Time Slot</label>
                <div className="flex gap-2 mt-1">
                  {['Morning', 'Afternoon', 'Night'].map(slot => {
                    const slotKey = slot.toLowerCase()
                    const isBooked = bookedSlots.map(s => s.toLowerCase()).includes(slotKey)
                    const isSelected = schedTime === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && setSchedTime(slot)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                          isBooked
                            ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                            : isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {slot}
                        {isBooked && <div className="text-[10px] font-medium mt-0.5">Already Booked</div>}
                      </button>
                    )
                  })}
                </div>
                {bookedSlots.length > 0 && schedDate && (
                  <p className="text-xs text-red-500 mt-1.5">⚠ Some slots are already booked for this date</p>
                )}
              </div>
              {slotError && (
                <p className="text-xs text-red-500 font-medium">⚠ {slotError}</p>
              )}
              <ActionBtn color="blue" onClick={() => {
                if (!schedDate) { setSlotError('Please select a date'); return }
                if (!schedTime) { setSlotError('Please select a time slot'); return }
                const isBooked = bookedSlots.map(s => s.toLowerCase()).includes(schedTime.toLowerCase())
                if (isBooked) { setSlotError(`${schedTime} slot is already booked for this date`); return }
                setSlotError('')
                act('Confirmed & Scheduled', { scheduledDate: schedDate, scheduledTime: schedTime })
              }}>
                Confirm Schedule
              </ActionBtn>
            </Section>
          )}

          {booking.status === 'Confirmed & Scheduled' && (
            <Section icon={<Play className="w-4 h-4" />} title="Start Work">
              {booking.scheduledDate && <Row label="Scheduled" value={`${formatDate(booking.scheduledDate)} — ${booking.scheduledTime}`} />}
              <button
                type="button"
                onClick={() => setShowReschedule(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 mt-1"
              >
                <Pencil className="w-3.5 h-3.5" /> {showReschedule ? 'Cancel Reschedule' : 'Edit / Reschedule'}
              </button>
              {showReschedule && (
                <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                  <Input label="New Date" value={reschedDate} onChange={setReschedDate} type="date" />
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">New Time Slot</label>
                    <div className="flex gap-2 mt-1">
                      {['Morning', 'Afternoon', 'Night'].map(slot => {
                        const slotKey = slot.toLowerCase()
                        const isBooked = reschedSlots.map(s => s.toLowerCase()).includes(slotKey)
                        const isSelected = reschedTime === slot
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => !isBooked && setReschedTime(slot)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                              isBooked
                                ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                                : isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400'
                            }`}
                          >
                            {slot}
                            {isBooked && <div className="text-[10px] font-medium mt-0.5">Already Booked</div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {reschedError && <p className="text-xs text-red-500 font-medium">⚠ {reschedError}</p>}
                  <ActionBtn color="blue" onClick={() => {
                    if (!reschedDate) { setReschedError('Please select a date'); return }
                    if (!reschedTime) { setReschedError('Please select a time slot'); return }
                    if (reschedSlots.map(s => s.toLowerCase()).includes(reschedTime.toLowerCase())) {
                      setReschedError(`${reschedTime} slot is already booked for this date`); return
                    }
                    setReschedError('')
                    act('Confirmed & Scheduled', { scheduledDate: reschedDate, scheduledTime: reschedTime })
                  }}>
                    Confirm New Schedule
                  </ActionBtn>
                </div>
              )}
              <ActionBtn color="orange" onClick={() => act('In Progress')}>Start Work</ActionBtn>
            </Section>
          )}

          {booking.status === 'In Progress' && (
            <Section icon={<CheckCircle className="w-4 h-4" />} title="Mark Completed">
              <Input label="Final Depth (ft)" value={finalDepth} onChange={setFinalDepth} placeholder="e.g. 450" />
              <Input label="Water Strike Level" value={waterStrike} onChange={setWaterStrike} placeholder="e.g. 380 ft" />
              <Input label="Final Amount (₹)" value={finalAmount} onChange={setFinalAmount} placeholder="e.g. 102600" />
              <Input label="Job Notes" value={jobNotes} onChange={setJobNotes} placeholder="Any remarks..." />
              <ActionBtn color="green" onClick={() => act('Completed', { finalDepth: Number(finalDepth), waterStrikeLevel: waterStrike, finalAmount: Number(finalAmount), jobNotes })}>
                Mark Completed
              </ActionBtn>
            </Section>
          )}

          {/* ── WhatsApp Updates ── */}
          <Section icon={<MessageCircle className="w-4 h-4" />} title="Send WhatsApp Update">
            <p className="text-xs text-slate-500 mb-3">
              Send a status update to <span className="font-semibold text-slate-700">{booking.customerName}</span> ({booking.mobile}) via WhatsApp.
            </p>
            <div className="flex flex-col gap-2">
              {booking.status === 'Team Assigned' && (
                <WaBtn
                  label="Team Assigned"
                  sub="Notify customer that team has been assigned"
                  onClick={() => openWhatsAppToCustomer(booking.mobile, buildTeamAssignedMessage(booking))}
                />
              )}
              {booking.status === 'Confirmed & Scheduled' && (
                <WaBtn
                  label="Schedule Confirmed"
                  sub="Share date, time and team details"
                  onClick={() => openWhatsAppToCustomer(booking.mobile, buildScheduleConfirmedMessage(booking))}
                />
              )}
              {booking.status === 'In Progress' && (
                <WaBtn
                  label="Work Started"
                  sub="Notify customer that drilling has begun"
                  onClick={() => openWhatsAppToCustomer(booking.mobile, buildWorkStartedMessage(booking))}
                />
              )}
              {booking.status === 'Completed' && (
                <WaBtn
                  label="Work Completed"
                  sub="Share final depth, water strike & amount"
                  onClick={() => openWhatsAppToCustomer(booking.mobile, buildWorkCompletedMessage(booking))}
                />
              )}
              {booking.status === 'Cancelled' && (
                <WaBtn
                  label="Cancellation Notice"
                  sub="Inform customer about the cancellation"
                  onClick={() => openWhatsAppToCustomer(booking.mobile, buildCancelledMessage(booking))}
                />
              )}
              {/* Always-available generic update */}
              <WaBtn
                label="Open WhatsApp Chat"
                sub="Start a direct conversation with the customer"
                onClick={() => openWhatsAppToCustomer(booking.mobile, `Hello ${booking.customerName},\n\nThis is S K Borewells regarding your booking *${booking.bookingId}*.\n\n`)}
                secondary
              />
            </div>
          </Section>

          {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
            <button onClick={() => act('Cancelled')} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium">
              <XCircle className="w-4 h-4" /> Cancel Booking
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
        <span className="text-blue-600">{icon}</span>{title}
      </div>
      <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
    </div>
  )
}

function ActionBtn({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-500 hover:bg-orange-600',
    green: 'bg-green-600 hover:bg-green-700',
  }
  return (
    <button onClick={onClick} className={`w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-colors mt-1 ${colors[color]}`}>
      {children}
    </button>
  )
}

function WaBtn({ label, sub, onClick, secondary = false }: { label: string; sub: string; onClick: () => void; secondary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
        secondary
          ? 'border-slate-200 bg-white hover:border-green-400 hover:bg-green-50'
          : 'border-green-400 bg-green-50 hover:bg-green-100'
      }`}
    >
      <MessageCircle className="w-5 h-5 text-green-600 shrink-0" />
      <div>
        <div className="text-sm font-semibold text-green-800">{label}</div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
    </button>
  )
}
