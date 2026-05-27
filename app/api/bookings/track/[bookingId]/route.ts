export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getBookingById } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params
    const booking = await getBookingById(bookingId)
    if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
    return NextResponse.json(booking)
  } catch (e) {
    console.error('[GET /api/bookings/track]', e)
    return NextResponse.json({ message: 'Error fetching booking' }, { status: 500 })
  }
}
