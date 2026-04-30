import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';

if (process.env.NODE_ENV === 'production' && 
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    JWT_SECRET === 'fallback-super-secret-key-change-in-prod') {
  console.error('CRITICAL: JWT_SECRET is using fallback in production!');
}

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

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role;
  const path = request.nextUrl.pathname;

  // Retire Client Dashboard
  if (path.startsWith('/dashboard/client')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect Worker Dashboard
  if (path.startsWith('/dashboard/worker')) {
    // Not logged in at all → redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const formattedRole = role?.toString().toUpperCase();
    const onboardingComplete = user?.user_metadata?.onboardingComplete;
    console.log(`[Middleware] Path: ${path} | MetaRole: ${formattedRole} | Onboarding: ${onboardingComplete}`);

    // --- ROLE CHECK ---
    // If auth metadata doesn't say WORKER, fall back to DB (handles stale session cookies)
    if (formattedRole !== 'WORKER') {
      const { data: dbUser } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!dbUser || dbUser.role !== 'WORKER') {
        console.warn(`[Middleware] Non-worker attempted ${path}. Redirecting to /login`);
        return NextResponse.redirect(new URL('/login', request.url));
      }
      console.log(`[Middleware] DB confirms WORKER for ${user.id}. Stale metadata — allowing through.`);
    }

    // --- ONBOARDING CHECK ---
    // Only send to setup if metadata flag is missing AND no WorkerProfile row exists in DB.
    // This prevents looping existing workers who completed setup before the flag was added.
    if (!onboardingComplete && path !== '/dashboard/worker/setup') {
      const { data: profile } = await supabase
        .from('WorkerProfile')
        .select('id')
        .eq('userId', user.id)
        .maybeSingle();

      if (!profile) {
        // Genuinely new — send to setup
        console.warn(`[Middleware] No WorkerProfile for ${user.email}. Redirecting to setup.`);
        return NextResponse.redirect(new URL('/dashboard/worker/setup', request.url));
      }
      // Profile exists in DB → onboarding done, metadata just stale → allow through
      console.log(`[Middleware] WorkerProfile found for ${user.id}. Allowing despite stale metadata.`);
    }
  }

  // Protect /dashboard/admin routes
  if (path.startsWith('/dashboard/admin')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin-portal/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(sessionCookie, secret);
      
      if (!payload.isAdmin) {
        throw new Error('Not an admin');
      }

      supabaseResponse.headers.set('x-admin-id', payload.id as string);
      supabaseResponse.headers.set('x-admin-username', payload.username as string);
    } catch (error) {
       console.error('Middleware JWT Error:', error);
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
