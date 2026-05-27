import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params
    const settings = await getSettings()
    settings.blockedDates = settings.blockedDates.filter(d => d !== date)
    await saveSettings(settings)
    return NextResponse.json({ success: true, blockedDates: settings.blockedDates })
  } catch (e) {
    console.error('[DELETE /api/admin/blocked-dates]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
