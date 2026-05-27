import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { date, slot } = await req.json()
    if (!date || !slot) return NextResponse.json({ error: 'date and slot required' }, { status: 400 })
    await supabase.from('slot_overrides').upsert({ date, slot: slot.toLowerCase() })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/slot-override]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
