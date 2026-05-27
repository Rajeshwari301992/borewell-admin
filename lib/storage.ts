import type { Booking, BookingStatus, Notification } from './types'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api'
const NOTIFICATIONS_KEY = 'borewell_admin_notifications'

export async function getAllBookings(): Promise<Booking[]> {
  try {
    const res = await fetch(`${API}/bookings`)
    return await res.json()
  } catch { return [] }
}

export async function updateBooking(bookingId: string, data: Partial<Booking>): Promise<void> {
  try {
    await fetch(`${API}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {}
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus, extra?: Partial<Booking>): Promise<void> {
  try {
    await fetch(`${API}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    if (status === 'Completed') addNotification('completed', `Job completed for booking ${bookingId}`, bookingId)
    if (status === 'Cancelled') addNotification('cancelled', `Booking ${bookingId} has been cancelled`, bookingId)
  } catch {}
}

export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]') }
  catch { return [] }
}

export function addNotification(type: Notification['type'], message: string, bookingId: string): void {
  const all = getNotifications()
  const notif: Notification = {
    id: `notif_${Date.now()}`,
    type, message, bookingId,
    timestamp: new Date().toISOString(),
    read: false,
  }
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([notif, ...all.slice(0, 49)]))
}

export function markNotificationsRead(): void {
  const all = getNotifications().map(n => ({ ...n, read: true }))
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all))
}

export async function seedDemoBookings(): Promise<void> {
  try {
    const existing = await getAllBookings()
    if (existing.length > 0) return

    const demo: Booking[] = [
      {
        id: '1', bookingId: 'BWP-DEMO-001', customerName: 'Ramesh Kumar', mobile: '9876543210',
        address: '12, MG Road', village: 'Bangalore', pincode: '560001',
        serviceType: 'Residential Borewell', depth: 400, estimatedAmount: 89250,
        bookingDate: '2026-05-20', status: 'Booking Received',
      },
      {
        id: '2', bookingId: 'BWP-DEMO-002', customerName: 'Suresh Gowda', mobile: '9845012345',
        address: '34, Hosur Road', village: 'Bangalore', pincode: '560100',
        serviceType: 'Agricultural Borewell', depth: 600, estimatedAmount: 115800,
        bookingDate: '2026-05-19', status: 'Team Assigned',
        assignedTeam: 'Team Alpha', assignedOperator: 'Mahesh B', assignedVehicle: 'KA-01-AB-1234',
      },
      {
        id: '3', bookingId: 'BWP-DEMO-003', customerName: 'Priya Sharma', mobile: '9731234567',
        address: '7, Mysore Road', village: 'Mysore', pincode: '570001',
        serviceType: 'Commercial Borewell', depth: 800, estimatedAmount: 187400,
        bookingDate: '2026-05-18', status: 'Completed',
        finalDepth: 800, waterStrikeLevel: '620 ft', finalAmount: 187400,
      },
    ]
    for (const b of demo) {
      await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
      })
    }
  } catch {}
}
