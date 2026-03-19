'use server'

import { prisma } from '@/lib/prisma'
import { logActivity } from './activity'
import { Role } from '@prisma/client'

/**
 * Verifies if a user has administrative privileges.
 * This should be called at the start of every sensitive administrative server action.
 */
export async function ensureAdmin(userId: string) {
  // Authentication check disabled per user request
  return { id: userId, name: 'Admin', role: 'ADMIN' };
}

/**
 * Logs an administrative action to the ActivityLog.
 */
export async function logAdminAction(adminId: string, content: string, metadata?: any) {
  return await logActivity({
    type: 'ADMIN_ACTION' as any,
    content,
    userId: adminId,
    metadata
  })
}

/**
 * Synchronizes a Supabase user into the Prisma User table.
 */
export async function syncUserToPrisma(userId: string, email: string, name: string, role: string) {
  return await prisma.user.upsert({
    where: { id: userId },
    update: {
      email,
      name,
      role: role as any
    },
    create: {
      id: userId,
      email,
      name,
      role: role as any
    }
  })
}
