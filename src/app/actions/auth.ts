'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { logActivity } from './activity'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-prod';

/**
 * Verifies if a user has administrative privileges using the secure JWT cookie.
 */
export async function ensureAdmin(userId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    throw new Error('Not authenticated as admin');
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      throw new Error('Not an admin');
    }
    
    // Optionally check if it matches the specific userId passed in
    if (userId && decoded.id !== userId) {
      throw new Error('Admin ID mismatch');
    }

    return { id: decoded.id, name: decoded.username, role: decoded.role };
  } catch (error) {
    throw new Error('Invalid or expired admin session');
  }
}

/**

 * Logs an administrative action to the ActivityLog.
 */
export async function logAdminAction(adminId: string, content: string, metadata?: any) {
  return await logActivity({
    type: 'ADMIN_ACTION',
    content,
    userId: adminId,
    metadata
  })
}

/**
 * Synchronizes a Supabase user into the User table.
 */
export async function syncUserToPrisma(userId: string, email: string, name: string, role: string) {
  const { data, error } = await supabaseAdmin
    .from('User')
    .upsert({
      id: userId,
      email,
      name,
      role: role as any,
      updatedAt: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) throw error;
  return data;
}
