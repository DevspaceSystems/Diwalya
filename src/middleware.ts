import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const role = session?.user?.user_metadata?.role;
  const path = request.nextUrl.pathname;

  // Retire Client Dashboard
  if (path.startsWith('/dashboard/client')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect Worker Dashboard
  if (path.startsWith('/dashboard/worker')) {
    const formattedRole = role?.toString().toUpperCase();
    console.log(`[Middleware Check] Path: ${path}, Session: ${!!session}, Role: ${role}, FormattedRole: ${formattedRole}`);
    
    if (!session || formattedRole !== 'WORKER') {
      console.warn(`[Middleware Redirect] Unauthorized access to ${path}. Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Only protect /dashboard/admin routes (existing logic)
  if (path.startsWith('/dashboard/admin')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin-portal/login', request.url));
    }

    try {
      // Verify JWT using jose
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(sessionCookie, secret);
      
      if (!payload.isAdmin) {
        throw new Error('Not an admin');
      }

      // Allow access and optionally pass down admin id in headers
      supabaseResponse.headers.set('x-admin-id', payload.id as string);
      supabaseResponse.headers.set('x-admin-username', payload.username as string);
    } catch (error) {
       console.error('Middleware JWT Error:', error);
       // Invalid or expired token, redirect to login and clear bad cookie
       const redirectResponse = NextResponse.redirect(new URL('/admin-portal/login', request.url));
       redirectResponse.cookies.delete('admin_session');
       return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/admin/:path*',
    '/dashboard/worker',
    '/dashboard/worker/:path*',
    '/dashboard/client',
    '/dashboard/client/:path*',
  ],
};
