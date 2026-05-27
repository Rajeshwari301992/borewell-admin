export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/db'

export async function GET() {
  try {
    return NextResponse.json(await getSettings())
  } catch (e) {
    console.error('[GET /api/admin/settings]', e)
    return NextResponse.json({ defaultLimit: 3, dayLimits: {}, blockedDates: [] })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const current = await getSettings()
    const updated = { ...current, ...body }
    await saveSettings(updated)
    return NextResponse.json({ success: true, settings: updated })
  } catch (e) {
    console.error('[PATCH /api/admin/settings]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
