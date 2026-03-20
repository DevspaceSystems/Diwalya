'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function logActivity(data: {
  type: any
  content: string
  userId?: string
  metadata?: any
}) {
  try {
    // 1. Save to Supabase
    const { data: log, error } = await supabaseAdmin
      .from('ActivityLog')
      .insert({
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: data.type,
        content: data.content,
        userId: data.userId,
        metadata: data.metadata
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Push to Firebase Realtime Database for "Live Feed" (Optional/Legacy support)
    // We'll keep this as a best effort if the credentials exist
    try {
        const admin = typeof window === 'undefined' ? eval('require')('firebase-admin') : null;
        if (admin && admin.apps.length) {
            const db = admin.database();
            const ref = db.ref('activities');
            await ref.push({
                ...log,
                timestamp: admin.database.ServerValue.TIMESTAMP
            });
        }
    } catch (firebaseError: any) {
      console.error('Firebase Realtime Logging Error:', firebaseError.message);
    }

    return { success: true, log };
  } catch (error: any) {
    console.error('Log Activity Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getRecentActivities(limit = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('ActivityLog')
      .select('*, user:User(name, role, profilePicture)')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Get Recent Activities Error:', error);
    return { success: false, error: error.message };
  }
}
