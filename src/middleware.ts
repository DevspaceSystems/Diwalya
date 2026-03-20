import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Only protect /dashboard/admin routes
  if (path.startsWith('/dashboard/admin')) {
    const sessionCookie = req.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin-portal/login', req.url));
    }

    try {
      // Verify JWT using jose (jsonwebtoken doesn't work in Edge runtime)
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(sessionCookie, secret);
      
      if (!payload.isAdmin) {
        throw new Error('Not an admin');
      }

      // Allow access and optionally pass down admin id in headers
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-admin-id', payload.id as string);
      requestHeaders.set('x-admin-username', payload.username as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
    } catch (error) {
       console.error('Middleware JWT Error:', error);
       // Invalid or expired token, redirect to login and clear bad cookie
       const response = NextResponse.redirect(new URL('/admin-portal/login', req.url));
       response.cookies.delete('admin_session');
       return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/admin/:path*',
  ],
};
