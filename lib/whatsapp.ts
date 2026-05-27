import type { Booking } from './types'

const COMPANY_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918310008194'

function toWaNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, '')
  return digits.startsWith('91') ? digits : `91${digits}`
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatAmount(n: number | undefined): string {
  if (!n) return '—'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// ── Messages sent FROM admin TO customer ──────────────────────────────────────

export function buildTeamAssignedMessage(booking: Booking): string {
  return [
    `Hello ${booking.customerName},`,
    '',
    `Your S K Borewells booking (*${booking.bookingId}*) has been confirmed and a team has been assigned.`,
    '',
    `*Team Details:*`,
    `• Team       : ${booking.assignedTeam || '—'}`,
    `• Operator   : ${booking.assignedOperator || '—'}`,
    `• Vehicle No : ${booking.assignedVehicle || '—'}`,
    '',
    `Our team will contact you before arriving at your site.`,
    '',
    `For queries, call us anytime.`,
    `— S K Borewells Team`,
  ].join('\n')
}

export function buildScheduleConfirmedMessage(booking: Booking): string {
  return [
    `Hello ${booking.customerName},`,
    '',
    `Your borewell service has been *Confirmed & Scheduled*.`,
    '',
    `*Schedule Details:*`,
    `• Booking ID   : ${booking.bookingId}`,
    `• Service Date : ${formatDate(booking.scheduledDate)}`,
    `• Time         : ${booking.scheduledTime || '—'}`,
    `• Team         : ${booking.assignedTeam || '—'}`,
    '',
    `Please ensure site access is available. Our team will arrive on time.`,
    '',
    `— S K Borewells Team`,
  ].join('\n')
}

export function buildWorkStartedMessage(booking: Booking): string {
  return [
    `Hello ${booking.customerName},`,
    '',
    `Great news! Our team has arrived at your site and *drilling work has started* for booking *${booking.bookingId}*.`,
    '',
    `Our operator will keep you updated on the progress throughout the day.`,
    '',
    `— S K Borewells Team`,
  ].join('\n')
}

export function buildWorkCompletedMessage(booking: Booking): string {
  const lines = [
    `Hello ${booking.customerName},`,
    '',
    `We are pleased to inform you that the borewell work for booking *${booking.bookingId}* has been *successfully completed*.`,
    '',
    `*Job Summary:*`,
    `• Final Depth     : ${booking.finalDepth ? `${booking.finalDepth} ft` : '—'}`,
    `• Water Strike    : ${booking.waterStrikeLevel || '—'}`,
    `• Final Amount    : ${formatAmount(booking.finalAmount)}`,
  ]
  if (booking.jobNotes) lines.push(`• Notes           : ${booking.jobNotes}`)
  lines.push(
    '',
    `Thank you for choosing S K Borewells. Please share your feedback whenever convenient.`,
    '',
    `— S K Borewells Team`,
  )
  return lines.join('\n')
}

export function buildCancelledMessage(booking: Booking): string {
  return [
    `Hello ${booking.customerName},`,
    '',
    `We regret to inform you that your booking *${booking.bookingId}* has been *cancelled*.`,
    '',
    `Please contact us if you have any questions or wish to rebook.`,
    '',
    `— S K Borewells Team`,
  ].join('\n')
}

// ── Open WhatsApp helpers ────────────────────────────────────────────────────

export function openWhatsAppToCustomer(mobile: string, message: string): void {
  window.open(
    `https://wa.me/${toWaNumber(mobile)}?text=${encodeURIComponent(message)}`,
    '_blank',
  )
}

export function openWhatsAppToCompany(message: string): void {
  window.open(
    `https://wa.me/${COMPANY_WA}?text=${encodeURIComponent(message)}`,
    '_blank',
  )
}
