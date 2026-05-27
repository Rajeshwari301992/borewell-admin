import { supabase } from './supabase'

// ── Type helpers ───────────────────────────────────────────────────────────

export interface Booking {
  id?: string
  bookingId: string
  customerName: string
  mobile: string
  altMobile?: string
  email?: string
  address?: string
  village?: string
  pincode?: string
  serviceType?: string
  depth?: number
  estimatedAmount?: number
  bookingDate?: string
  requiredDate?: string
  status?: string
  notes?: string
  timeSlot?: string
  assignedTeam?: string
  assignedOperator?: string
  assignedVehicle?: string
  scheduledDate?: string
  scheduledTime?: string
  finalDepth?: number
  waterStrikeLevel?: string
  finalAmount?: number
  jobNotes?: string
  createdAt?: string
}

export interface Settings {
  defaultLimit: number
  dayLimits: Record<string, number>
  blockedDates: string[]
}

// ── Mappers ────────────────────────────────────────────────────────────────

function toRow(b: Booking) {
  return {
    booking_id:       b.bookingId,
    customer_name:    b.customerName || '',
    mobile:           b.mobile || '',
    alt_mobile:       b.altMobile || '',
    email:            b.email ? b.email.toLowerCase().trim() : '',
    address:          b.address || '',
    village:          b.village || '',
    pincode:          b.pincode || '',
    service_type:     b.serviceType || '',
    depth:            b.depth || 0,
    estimated_amount: b.estimatedAmount || 0,
    booking_date:     b.bookingDate || '',
    required_date:    b.requiredDate || '',
    status:           b.status || 'Booking Received',
    notes:            b.notes || '',
    time_slot:        b.timeSlot || '',
    assigned_team:    b.assignedTeam || '',
    assigned_operator:b.assignedOperator || '',
    assigned_vehicle: b.assignedVehicle || '',
    scheduled_date:   b.scheduledDate || '',
    scheduled_time:   b.scheduledTime || '',
    final_depth:      b.finalDepth ?? null,
    water_strike_level: b.waterStrikeLevel ?? null,
    final_amount:     b.finalAmount ?? null,
    job_notes:        b.jobNotes || '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Booking {
  return {
    id:               r.booking_id,
    bookingId:        r.booking_id,
    customerName:     r.customer_name,
    mobile:           r.mobile,
    altMobile:        r.alt_mobile,
    email:            r.email,
    address:          r.address,
    village:          r.village,
    pincode:          r.pincode,
    serviceType:      r.service_type,
    depth:            r.depth,
    estimatedAmount:  r.estimated_amount,
    bookingDate:      r.booking_date,
    requiredDate:     r.required_date,
    status:           r.status,
    notes:            r.notes,
    timeSlot:         r.time_slot,
    assignedTeam:     r.assigned_team,
    assignedOperator: r.assigned_operator,
    assignedVehicle:  r.assigned_vehicle,
    scheduledDate:    r.scheduled_date,
    scheduledTime:    r.scheduled_time,
    finalDepth:       r.final_depth,
    waterStrikeLevel: r.water_strike_level,
    finalAmount:      r.final_amount,
    jobNotes:         r.job_notes,
    createdAt:        r.created_at,
  }
}

// ── Bookings ───────────────────────────────────────────────────────────────

export async function getAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .single()
  return data ? fromRow(data) : null
}

export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .order('created_at', { ascending: false })
  return (data || []).map(fromRow)
}

export async function getBookingsByMobile(mobile: string): Promise<Booking[]> {
  const clean = mobile.replace(/\D/g, '')
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('mobile', clean)
    .order('created_at', { ascending: false })
  return (data || []).map(fromRow)
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('required_date', date)
    .neq('status', 'Cancelled')
  return (data || []).map(fromRow)
}

export async function createBooking(b: Booking): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .insert(toRow(b))
  if (error) throw error
}

export async function updateBooking(bookingId: string, data: Partial<Booking>): Promise<Booking> {
  const row: Record<string, unknown> = {}
  if (data.status !== undefined)          row.status            = data.status
  if (data.customerName !== undefined)    row.customer_name     = data.customerName
  if (data.mobile !== undefined)          row.mobile            = data.mobile
  if (data.altMobile !== undefined)       row.alt_mobile        = data.altMobile
  if (data.email !== undefined)           row.email             = data.email
  if (data.address !== undefined)         row.address           = data.address
  if (data.village !== undefined)         row.village           = data.village
  if (data.pincode !== undefined)         row.pincode           = data.pincode
  if (data.serviceType !== undefined)     row.service_type      = data.serviceType
  if (data.depth !== undefined)           row.depth             = data.depth
  if (data.estimatedAmount !== undefined) row.estimated_amount  = data.estimatedAmount
  if (data.requiredDate !== undefined)    row.required_date     = data.requiredDate
  if (data.notes !== undefined)           row.notes             = data.notes
  if (data.assignedTeam !== undefined)    row.assigned_team     = data.assignedTeam
  if (data.assignedOperator !== undefined)row.assigned_operator = data.assignedOperator
  if (data.assignedVehicle !== undefined) row.assigned_vehicle  = data.assignedVehicle
  if (data.scheduledDate !== undefined)   row.scheduled_date    = data.scheduledDate
  if (data.scheduledTime !== undefined)   row.scheduled_time    = data.scheduledTime
  if (data.finalDepth !== undefined)      row.final_depth       = data.finalDepth
  if (data.waterStrikeLevel !== undefined)row.water_strike_level= data.waterStrikeLevel
  if (data.finalAmount !== undefined)     row.final_amount      = data.finalAmount
  if (data.jobNotes !== undefined)        row.job_notes         = data.jobNotes
  if (data.timeSlot !== undefined)        row.time_slot         = data.timeSlot

  const { data: updated, error } = await supabase
    .from('bookings')
    .update(row)
    .eq('booking_id', bookingId)
    .select()
    .single()
  if (error) throw error
  return fromRow(updated)
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const { data } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single()
  if (!data) return { defaultLimit: 3, dayLimits: {}, blockedDates: [] }
  return {
    defaultLimit: data.default_limit ?? 3,
    dayLimits:    data.day_limits ?? {},
    blockedDates: data.blocked_dates ?? [],
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (settings.defaultLimit !== undefined) row.default_limit = settings.defaultLimit
  if (settings.dayLimits !== undefined)    row.day_limits    = settings.dayLimits
  if (settings.blockedDates !== undefined) row.blocked_dates = settings.blockedDates
  await supabase.from('app_settings').upsert({ id: 1, ...row })
}
