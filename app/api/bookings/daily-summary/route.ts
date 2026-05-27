import { NextResponse } from 'next/server'
import { getAllBookings, getSettings } from '@/lib/db'

export async function GET() {
  try {
    const [bookings, settings] = await Promise.all([getAllBookings(), getSettings()])

    const byDate: Record<string, number> = {}
    for (const b of bookings) {
      if (!b.requiredDate || b.status === 'Cancelled') continue
      byDate[b.requiredDate] = (byDate[b.requiredDate] || 0) + 1
    }
    for (const d of settings.blockedDates) {
      if (!(d in byDate)) byDate[d] = 0
    }

    const summary = Object.entries(byDate).map(([date, count]) => {
      const limit = settings.dayLimits[date] ?? settings.defaultLimit
      const blocked = settings.blockedDates.includes(date)
      return { date, count, limit, remaining: Math.max(0, limit - count), blocked }
    }).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(summary)
  } catch (e) {
    console.error('[GET /api/bookings/daily-summary]', e)
    return NextResponse.json([], { status: 500 })
  }
}
