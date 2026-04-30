import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname;

  // 1. Retire Client Dashboard
  if (path.startsWith('/dashboard/client')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Protect Worker Dashboard
  if (path.startsWith('/dashboard/worker')) {
    // If not logged in, always redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // We REMOVE the role/onboarding redirect from here.
    // It's too prone to stale session loops in the Edge Runtime.
    // The individual pages (/dashboard/worker/page.tsx and /setup/page.tsx) 
    // will handle their own internal redirection based on real-time DB state.
    return supabaseResponse;
  }

  // 3. Protect Admin Dashboard
  if (path.startsWith('/dashboard/admin')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (!sessionCookie) return NextResponse.redirect(new URL('/admin-portal/login', request.url));

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(sessionCookie, secret);
      if (!payload.isAdmin) throw new Error('Not an admin');
      supabaseResponse.headers.set('x-admin-id', payload.id as string);
    } catch (error) {
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
