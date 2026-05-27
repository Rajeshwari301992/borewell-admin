import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json()
    if (!date) return NextResponse.json({ success: false, message: 'Date required' }, { status: 400 })
    const settings = await getSettings()
    if (!settings.blockedDates.includes(date)) {
      settings.blockedDates.push(date)
      await saveSettings(settings)
    }
    return NextResponse.json({ success: true, blockedDates: settings.blockedDates })
  } catch (e) {
    console.error('[POST /api/admin/blocked-dates]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
