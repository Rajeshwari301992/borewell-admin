import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAllBookings } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params

    // Get overrides from DB
    const { data: overrides } = await supabase
      .from('slot_overrides')
      .select('slot')
      .eq('date', date)
    const booked = new Set((overrides || []).map((o: { slot: string }) => o.slot))

    // Add from bookings
    const bookings = await getAllBookings()
    for (const b of bookings) {
      if (b.status === 'Cancelled') continue
      if (b.requiredDate === date && b.timeSlot) booked.add(b.timeSlot.toLowerCase())
      if (b.scheduledDate === date && b.scheduledTime) booked.add(b.scheduledTime.toLowerCase())
    }

    return NextResponse.json([...booked])
  } catch (e) {
    console.error('[GET /api/booked-slots]', e)
    return NextResponse.json([])
  }
}
