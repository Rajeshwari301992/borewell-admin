import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email: string = (body.email ?? '').trim().toLowerCase()
    const otp: string   = (body.otp   ?? '').trim()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 })
    }

    const result = verifyOtp(email, otp)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Email verified successfully.' })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 })
  }
}
