
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'user_session';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Allow access to the login page regardless of authentication status
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // If no session cookie, redirect to login page for any protected route
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const session = JSON.parse(sessionCookie);
    const { role } = session;

    // If logged in, prevent access to the wrong dashboard
    if (role === 'lawyer' && !pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (role === 'client' && !pathname.startsWith('/client')) {
        return NextResponse.redirect(new URL('/client/dashboard', request.url));
    }
  } catch (error) {
    // If cookie is invalid, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
