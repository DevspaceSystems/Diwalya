
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: users, error: uError } = await supabaseAdmin
      .from('User')
      .select('id, name, email, role');
    
    const { data: profiles, error: pError } = await supabaseAdmin
      .from('WorkerProfile')
      .select('userId, location, category');

    return NextResponse.json({
      success: true,
      users,
      profiles,
      uError,
      pError
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
