import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a placeholder middleware to prevent Next.js build errors.
// The application now uses a client-side authentication model, so this
// middleware does not perform any logic.
// By providing a matcher that will never match any route, we ensure
// this middleware never runs.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: '/api/this-route-does-not-exist',
};
