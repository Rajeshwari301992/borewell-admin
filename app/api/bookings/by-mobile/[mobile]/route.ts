export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getBookingsByMobile } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ mobile: string }> }) {
  try {
    const { mobile } = await params
    const bookings = await getBookingsByMobile(mobile)
    return NextResponse.json(bookings)
  } catch (e) {
    console.error('[GET /api/bookings/by-mobile]', e)
    return NextResponse.json([], { status: 200 })
  }
}
