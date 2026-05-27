// Server-side in-memory OTP store (persists across requests in same Node.js process)
// For production use Redis instead.

interface OtpRecord {
  otp: string
  expiresAt: number   // unix ms
  attempts: number
}

interface RateRecord {
  count: number
  resetAt: number     // unix ms
}

// Module-level maps survive across API requests in the same worker
const otpStore = new Map<string, OtpRecord>()
const rateMap  = new Map<string, RateRecord>()

const OTP_TTL_MS    = 5 * 60 * 1000   // 5 minutes
const RATE_WINDOW   = 60 * 1000        // 1 minute window
const RATE_MAX      = 3                // max 3 sends per window
const MAX_ATTEMPTS  = 5                // max wrong guesses before invalidation

export function checkRateLimit(email: string): boolean {
  const now  = Date.now()
  const rec  = rateMap.get(email)
  if (!rec || now > rec.resetAt) {
    rateMap.set(email, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (rec.count >= RATE_MAX) return false
  rec.count++
  return true
}

export function saveOtp(email: string, otp: string): void {
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 })
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: string }

export function verifyOtp(email: string, entered: string): VerifyResult {
  const rec = otpStore.get(email)
  if (!rec) return { ok: false, error: 'No OTP found. Please request a new one.' }
  if (Date.now() > rec.expiresAt) {
    otpStore.delete(email)
    return { ok: false, error: 'OTP expired. Please request a new one.' }
  }
  rec.attempts++
  if (rec.attempts > MAX_ATTEMPTS) {
    otpStore.delete(email)
    return { ok: false, error: 'Too many attempts. Please request a new OTP.' }
  }
  if (rec.otp !== entered.trim()) {
    return { ok: false, error: 'Invalid OTP. Please try again.' }
  }
  otpStore.delete(email)
  return { ok: true }
}
