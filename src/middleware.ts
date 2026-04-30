import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import * as jose from 'jose';
import { createClient } from '@supabase/supabase-js';

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

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role;
  const path = request.nextUrl.pathname;

  // Retire Client Dashboard
  if (path.startsWith('/dashboard/client')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect Worker Dashboard
  if (path.startsWith('/dashboard/worker')) {
    const formattedRole = role?.toString().toUpperCase();
    const onboardingComplete = user?.user_metadata?.onboardingComplete;
    console.log(`[Middleware Check] Path: ${path}, Role: ${formattedRole}, Onboarding: ${onboardingComplete}`);
    
    if (!user) {
      console.warn(`[Middleware Redirect] No session for ${path}. Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If role in metadata isn't WORKER, check DB as fallback (handles stale cookies)
    if (formattedRole !== 'WORKER') {
      // Check if user has WORKER role in the database
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      const { data: dbUser } = await adminClient
        .from('User')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!dbUser || dbUser.role !== 'WORKER') {
        console.warn(`[Middleware Redirect] Non-worker access to ${path}. Redirecting to /login`);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // They ARE a worker in DB — fix their stale metadata and let them through
      console.log(`[Middleware] Worker ${user.id} has stale metadata. Allowing access to ${path}.`);
    }

    // Force onboarding only if metadata flag is missing AND no WorkerProfile exists in DB
    if (!onboardingComplete && path !== '/dashboard/worker/setup') {
      // Check DB for existing worker profile before forcing redirect
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      const { data: profile } = await adminClient
        .from('WorkerProfile')
        .select('id')
        .eq('userId', user.id)
        .maybeSingle();

      if (!profile) {
        // Truly incomplete — send to setup
        console.warn(`[Middleware Redirect] No WorkerProfile for ${user.email}. Redirecting to setup.`);
        return NextResponse.redirect(new URL('/dashboard/worker/setup', request.url));
      }
      // Profile exists — they completed setup, metadata is just stale. Allow through.
      console.log(`[Middleware] Worker ${user.id} has existing profile. Allowing access despite stale metadata.`);
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
