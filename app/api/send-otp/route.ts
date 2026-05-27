import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { checkRateLimit, saveOtp } from '@/lib/otp-store'
import { buildOtpEmail } from '@/lib/email-template'

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email: string = (body.email ?? '').trim().toLowerCase()

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }

    const otp = generateOTP()
    saveOtp(email, otp)

    const smtpReady =
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      !process.env.SMTP_USER.includes('your-email')   // skip if still placeholder

    if (smtpReady) {
      const { subject, html } = buildOtpEmail(otp)
      const transporter = createTransporter()
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME ?? 'S K Borewells'}" <${process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER}>`,
        to: email,
        subject,
        html,
      })
    } else {
      // Dev mode: SMTP not configured — print OTP to server console
      console.log(`\n╔══════════════════════════════════════╗`)
      console.log(`║  OTP DEV MODE (SMTP not configured)  ║`)
      console.log(`║  Email : ${email.padEnd(28)}║`)
      console.log(`║  OTP   : ${otp.padEnd(28)}║`)
      console.log(`╚══════════════════════════════════════╝\n`)
    }

    return NextResponse.json({ success: true, message: 'OTP sent to your email address.' })
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please check your email and try again.' },
      { status: 500 }
    )
  }
}
