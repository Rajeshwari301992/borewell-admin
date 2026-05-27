export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getBookingsByDate, getSettings } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params
    const settings = await getSettings()

    if (settings.blockedDates.includes(date)) {
      return NextResponse.json({ count: 0, limit: 0, remaining: 0, blocked: true })
    }

    const bookings = await getBookingsByDate(date)
    const limit = settings.dayLimits[date] ?? settings.defaultLimit
    const count = bookings.length
    const remaining = Math.max(0, limit - count)

    return NextResponse.json({ count, limit, remaining, blocked: false })
  } catch (e) {
    console.error('[GET /api/booking-count]', e)
    return NextResponse.json({ count: 0, limit: 3, remaining: 0, blocked: false })
  }
}
