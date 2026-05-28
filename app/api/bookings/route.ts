export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getAllBookings, createBooking, getBookingsByDate, getSettings } from '@/lib/db'
import { buildBookingConfirmationEmail } from '@/lib/email-template'

async function sendConfirmationEmail(booking: {
  bookingId: string; customerName: string; mobile: string; email?: string
  serviceType?: string; requiredDate?: string; depth?: number
  estimatedAmount?: number; address?: string; village?: string; pincode?: string; notes?: string
}) {
  if (!booking.email) return
  const smtpReady = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    && !process.env.SMTP_USER.includes('your-email')
  if (!smtpReady) return

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const { subject, html } = buildBookingConfirmationEmail(booking)
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? 'S K Borewells'}" <${process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER}>`,
    to: booking.email,
    subject,
    html,
  })
}

export async function GET() {
  try {
    const bookings = await getAllBookings()
    return NextResponse.json(bookings)
  } catch (e) {
    console.error('[GET /api/bookings]', e)
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const booking = await req.json()
    const settings = await getSettings()
    const date = booking.requiredDate || booking.required_date

    if (date) {
      if (settings.blockedDates.includes(date)) {
        return NextResponse.json({ success: false, message: 'Selected date is blocked by admin.' }, { status: 409 })
      }
      const limit = settings.dayLimits[date] ?? settings.defaultLimit
      const existing = await getBookingsByDate(date)
      if (existing.length >= limit) {
        return NextResponse.json({
          success: false,
          message: `Booking limit reached for ${date}. Selected date is fully booked.`,
        }, { status: 409 })
      }
    }

    const saved = { ...booking, bookingId: booking.bookingId || booking.id, status: booking.status || 'Booking Received' }
    await createBooking(saved)

    // Send confirmation email — fire-and-forget (don't block response)
    sendConfirmationEmail(saved).catch(e => console.error('[booking-email]', e))

    return NextResponse.json({ success: true, message: 'Booking confirmed successfully' }, { status: 201 })
  } catch (e: unknown) {
    // Duplicate booking ID — treat as success (idempotent)
    if (e instanceof Error && e.message?.includes('duplicate')) {
      return NextResponse.json({ success: true, message: 'Booking already exists' }, { status: 200 })
    }
    const err = e as Record<string, unknown>
    const msg = (err?.message as string) || (err?.error_description as string) || JSON.stringify(e)
    console.error('[POST /api/bookings]', msg, err?.code, err?.details)
    return NextResponse.json({ error: msg, code: err?.code, details: err?.details }, { status: 500 })
  }
}
