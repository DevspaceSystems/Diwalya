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
    // If metadata role is not WORKER, query DB as fallback (handles stale session cookies)
    if (formattedRole !== 'WORKER') {
      const supabaseAdmin = createServerClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll() { /* no-op */ }
          }
        }
      );

      const { data: dbUser } = await supabaseAdmin
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
    if (!onboardingComplete && path !== '/dashboard/worker/setup') {
      try {
        // We MUST use the service role key here because RLS might block the anon key 
        // from seeing the profile in the Edge Runtime environment.
        const supabaseAdmin = createServerClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              getAll() { return request.cookies.getAll() },
              setAll() { /* no-op for check */ }
            }
          }
        );

        const { data: profile, error: profileError } = await supabaseAdmin
          .from('WorkerProfile')
          .select('id')
          .eq('userId', user.id)
          .maybeSingle();

        if (!profileError && !profile) {
          console.warn(`[Middleware] No WorkerProfile found for ${user.email}. Redirecting to setup.`);
          return NextResponse.redirect(new URL('/dashboard/worker/setup', request.url));
        }
        
        if (profile) {
          console.log(`[Middleware] WorkerProfile confirmed via Admin for ${user.id}. Allowing access.`);
        }
      } catch (err) {
        console.error('[Middleware] DB Check Error:', err);
      }
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
