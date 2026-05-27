import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BookingStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const STATUS_CONFIG: Record<BookingStatus, { color: string; bg: string; dot: string }> = {
  'Booking Received': { color: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-400' },
  'Team Assigned':    { color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-400' },
  'Confirmed & Scheduled': { color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  'In Progress':      { color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-400' },
  'Completed':        { color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  'Cancelled':        { color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
}
