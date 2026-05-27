import { NextRequest, NextResponse } from 'next/server'
import { getBookingsByEmail } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params
    const bookings = await getBookingsByEmail(decodeURIComponent(email))
    return NextResponse.json(bookings)
  } catch (e) {
    console.error('[GET /api/bookings/by-email]', e)
    return NextResponse.json([], { status: 200 })
  }
}
