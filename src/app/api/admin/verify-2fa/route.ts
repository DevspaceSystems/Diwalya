import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticator } from 'otplib';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';

export async function POST(req: Request) {
  try {
    const { token: totpCode, secret } = await req.json();

    if (!totpCode || !secret) {
      return NextResponse.json({ error: 'Missing code or secret' }, { status: 400 });
    }

    // Must be logged in
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_session')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(adminToken, JWT_SECRET);
    if (!decoded.isAdmin || !decoded.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify the code against the provided secret
    const isValid = authenticator.verify({
      token: totpCode,
      secret
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
    }

    // Success! Save the secret to the database
    const { error: updateError } = await supabaseAdmin
      .from('admin_credentials')
      .update({ totp_secret: secret })
      .eq('id', decoded.id);

    if (updateError) {
       console.error(updateError);
       return NextResponse.json({ error: 'Failed to save 2FA settings' }, { status: 500 });
    }

    await supabaseAdmin.from('ActivityLog').insert({
      type: 'ADMIN_ACTION',
      content: 'Enabled Two-Factor Authentication (2FA)',
      userId: decoded.id
    });

    return NextResponse.json({ success: true, message: '2FA enabled successfully' });

  } catch (error) {
    console.error('2FA Verify Error:', error);
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
  }
}
