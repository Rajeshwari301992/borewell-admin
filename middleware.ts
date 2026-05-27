import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/api', '/track-booking']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow root — client-side redirects handle it
  if (pathname === '/') return NextResponse.next()

  const cookie = request.cookies.get('borewell_session')

  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let session: { role?: string } = {}
  try {
    session = JSON.parse(decodeURIComponent(cookie.value))
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = session.role

  // Admin-only routes
  if (pathname.startsWith('/dashboard')) {
    if (role !== 'admin') {
      const dest = role === 'customer' ? '/customer-dashboard' : '/login'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // Customer-only routes
  if (pathname.startsWith('/customer-dashboard')) {
    if (role !== 'customer') {
      const dest = role === 'admin' ? '/dashboard' : '/login'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
