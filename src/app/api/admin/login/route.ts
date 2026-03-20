import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';

// Use a secure random string for JWT signing in production (set in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const { username, password, totpCode } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // 1. Fetch admin by username
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admin_credentials')
      .select('*')
      .eq('username', username)
      .single();

    if (!admin || fetchError) {
      // Return generic error to prevent username enumeration
      await logFailedAttempt(username, req);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!admin.is_active) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    // 2. Check for brute-force lock
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return NextResponse.json({ 
        error: `Account is temporarily locked. Try again later.`,
        locked: true 
      }, { status: 423 });
    }

    // 3. Verify bcrypt password hash
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      await handleFailedAttempt(admin.id, admin.failed_attempts);
      await logFailedAttempt(username, req);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 4. Handle 2FA (TOTP)
    if (admin.totp_secret) {
      // If client didn't provide a code, tell them we need one
      if (!totpCode) {
         return NextResponse.json({ requires2FA: true }, { status: 200 });
      }

      // Verify the provided code
      const isValidTotp = authenticator.verify({
        token: totpCode,
        secret: admin.totp_secret
      });

      if (!isValidTotp) {
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
      }
    }

    // 5. Successful Login
    // Reset failed attempts
    await supabaseAdmin
      .from('admin_credentials')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('id', admin.id);

    // Create JWT
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        isAdmin: true 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Create response and set HTTP-only cookie
    const response = NextResponse.json({ success: true, redirect: '/dashboard/admin' }, { status: 200 });
    
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    // Log the successful login Activity Log
    await supabaseAdmin.from('ActivityLog').insert({
      type: 'ADMIN_ACTION',
      content: `Secure Admin login: ${admin.username}`,
      userId: admin.id, // For activity log
      metadata: { ip: req.headers.get('x-forwarded-for') || 'unknown' }
    });

    return response;

  } catch (error: any) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helpers
async function handleFailedAttempt(adminId: string, currentAttempts: number) {
  const newAttempts = currentAttempts + 1;
  const updateData: any = { failed_attempts: newAttempts };

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + LOCKOUT_MINUTES);
    updateData.locked_until = lockTime.toISOString();
  }

  await supabaseAdmin
    .from('admin_credentials')
    .update(updateData)
    .eq('id', adminId);
}

async function logFailedAttempt(username: string, req: Request) {
   // Log suspicious activity silently
   try {
     await supabaseAdmin.from('ActivityLog').insert({
        type: 'SYSTEM_ALERT',
        content: `Failed admin login attempt for username: ${username}`,
        metadata: { ip: req.headers.get('x-forwarded-for') || 'unknown' }
     });
   } catch (e) {
     console.error(e);
   }
}
