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
    if (!user) return NextResponse.redirect(new URL('/login', request.url));

    const role = user.user_metadata?.role?.toString().toUpperCase();
    
    // If they already have the WORKER role, they are complete.
    // This handles existing workers with stale session metadata.
    if (role === 'WORKER') {
      return supabaseResponse;
    }

    // Fallback: Check DB role if metadata is stale
    const supabaseAdmin = createServerClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: { getAll() { return request.cookies.getAll() }, setAll() {} }
    });

    const { data: dbUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (dbUser?.role === 'WORKER') {
      return supabaseResponse;
    }

    // Genuinely not a worker or new user -> force setup if they aren't there already
    if (path !== '/dashboard/worker/setup') {
      // Check if they have a profile already
      const { data: profile } = await supabaseAdmin
        .from('WorkerProfile')
        .select('id')
        .eq('userId', user.id)
        .maybeSingle();

      if (!profile) {
        return NextResponse.redirect(new URL('/dashboard/worker/setup', request.url));
      }
    }
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
