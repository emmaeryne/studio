
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = '__session';

// Define protected routes prefixes
const protectedRoutes = ['/dashboard', '/client'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Check if the user is trying to access a protected route
  const isAccessingProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isAccessingProtectedRoute) {
    // If there's no session cookie, redirect to the login page
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If the user is logged in and tries to access the login page, redirect them away
  if (pathname.startsWith('/login') && sessionCookie) {
      // We don't know their role here, so we redirect to a neutral page.
      // The root page will handle the role-based redirect.
      return NextResponse.redirect(new URL('/', request.url));
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
