export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAllBookings, createBooking, getBookingsByDate, getSettings } from '@/lib/db'

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

    await createBooking({
      ...booking,
      bookingId: booking.bookingId || booking.id,
      status: booking.status || 'Booking Received',
    })
    return NextResponse.json({ success: true, message: 'Booking confirmed successfully' }, { status: 201 })
  } catch (e: unknown) {
    // Duplicate booking ID — treat as success (idempotent)
    if (e instanceof Error && e.message?.includes('duplicate')) {
      return NextResponse.json({ success: true, message: 'Booking already exists' }, { status: 200 })
    }
    console.error('[POST /api/bookings]', e)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
