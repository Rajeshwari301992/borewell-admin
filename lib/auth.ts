export type UserRole = 'admin' | 'customer'

export interface Session {
  username: string
  role: UserRole
  email?: string       // set for customer email-based login
  loginTime: number
  rememberMe: boolean
}

const SESSION_KEY = 'borewell_session'
const CREDENTIALS_KEY = 'borewell_admin_credentials'

function getAdminCredentials() {
  try {
    const stored = JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || '{}')
    return {
      username: stored.username || 'admin',
      password: stored.password || '123456',
    }
  } catch {
    return { username: 'admin', password: '123456' }
  }
}

function setCookie(value: string, days: number) {
  const expires = days > 0 ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : ''
  document.cookie = `${SESSION_KEY}=${encodeURIComponent(value)}; path=/${expires}; SameSite=Lax`
}

function clearCookie() {
  document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

// Customer login: identifier = mobile number (10 digits), no password needed
// Admin login:    identifier = username, password required
export function login(
  identifier: string,
  password: string,
  role: UserRole,
  rememberMe = false
): boolean {
  if (typeof window === 'undefined') return false

  let session: Session

  if (role === 'customer') {
    const email = identifier.trim().toLowerCase()
    if (!email.includes('@')) return false
    session = { username: email, role: 'customer', email, loginTime: Date.now(), rememberMe }
  } else {
    const u = identifier.trim().toLowerCase()
    const creds = getAdminCredentials()
    if (u !== creds.username.toLowerCase() || password !== creds.password) return false
    session = { username: u, role: 'admin', loginTime: Date.now(), rememberMe }
  }

  const raw = JSON.stringify(session)
  localStorage.setItem(SESSION_KEY, raw)
  setCookie(raw, rememberMe ? 30 : 1)
  return true
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
  clearCookie()
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed.role || (parsed.role !== 'admin' && parsed.role !== 'customer')) {
      localStorage.removeItem(SESSION_KEY)
      clearCookie()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function getRole(): UserRole | null {
  return getSession()?.role ?? null
}

export function isAdmin(): boolean {
  return getRole() === 'admin'
}

export function isCustomer(): boolean {
  return getRole() === 'customer'
}

export function getCustomerEmail(): string | null {
  const s = getSession()
  return s?.role === 'customer' ? (s.email ?? null) : null
}

export function updateCredentials(username: string, password?: string): void {
  if (typeof window === 'undefined') return
  const current = getAdminCredentials()
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({
    username,
    password: password && password.trim() ? password : current.password,
  }))
}
