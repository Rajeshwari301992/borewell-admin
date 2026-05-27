import { NextRequest, NextResponse } from 'next/server'
import { updateBooking } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const updated = await updateBooking(id, data)
    return NextResponse.json({ success: true, booking: updated })
  } catch (e) {
    console.error('[PATCH /api/bookings/:id]', e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// Legacy alias used by admin dashboard
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params })
}
