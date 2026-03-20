import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';

export async function POST() {
  try {
    // We only allow 2FA setup for currently logged in admins
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin || !decoded.username) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 1. Generate a new secret
    const secret = authenticator.generateSecret();
    
    // 2. Generate an otpauth:// URL for the authenticator app
    const otpauth = authenticator.keyuri(
      decoded.username,
      'Diwalya Admin Portal',
      secret
    );

    // 3. Generate QR code image as data URI
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    // Do NOT save the secret to the database yet. 
    // We only save it after they successfully verify the first code in /verify-2fa

    return NextResponse.json({ 
      success: true, 
      secret,      // So the admin can enter it manually if needed
      qrCodeUrl    // For the UI to display the QR code
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    return NextResponse.json({ error: 'Failed to generate 2FA setup' }, { status: 500 });
  }
}
