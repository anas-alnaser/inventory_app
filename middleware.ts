import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup']

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/inventory', '/suppliers', '/menu-items', '/reports', '/forecasts', '/anomalies', '/users', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api')

  // For protected routes, we'll let the client-side handle auth checks
  // This middleware is mainly for future server-side auth if needed
  // The useAuth hook will handle redirects on the client side
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

