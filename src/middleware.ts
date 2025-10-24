// middleware.ts (auth redirect)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const protectedRoutes = ['/projects', '/dashboard', '/profile']

  console.log('🔍 pathname:', req.nextUrl.pathname)
  console.log('🍪 token:', token === undefined ? '<missing>' : token)

  if (protectedRoutes.some(path => req.nextUrl.pathname.startsWith(path))) {
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      console.log('🚫 Redirecting to /login')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/projects/:path*', '/dashboard/:path*', '/profile/:path*'],
}