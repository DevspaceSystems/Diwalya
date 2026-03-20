import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    // Clear the secure JWT cookie
    const response = NextResponse.json({ success: true, redirect: '/admin-portal/login' });
    response.cookies.delete('admin_session');
    
    // Optional: Try to parse who logged out via some headers or cookies for ActivityLog
    // Simple log for now
    await supabaseAdmin.from('ActivityLog').insert({
      type: 'ADMIN_ACTION',
      content: 'Secure Admin logged out',
      metadata: { action: 'logout' }
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
