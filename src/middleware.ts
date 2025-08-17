
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from './lib/firebase-admin';

const SESSION_COOKIE_NAME = '__session';

async function verifySession(request: NextRequest) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
        return null;
    }
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch (error) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to the login page always
  if (pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  const decodedToken = await verifySession(request);

  // If no valid session, redirect to login for any protected route
  if (!decodedToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  // The user's role needs to be fetched from Firestore, which is slow for middleware.
  // For now, we allow access if they are logged in. We'll rely on server components
  // and layouts to perform role-based redirects.
  // A more advanced implementation might store the role in the custom token.

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
     * - login (the login page itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
