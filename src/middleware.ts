import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // Full protection happens in admin pages/API routes via AuthContext and isUserAdmin
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};