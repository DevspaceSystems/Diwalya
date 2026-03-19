'use server'

import { prisma } from '@/lib/prisma'

export async function checkAdminAccess(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    });
    
    return (user?.role as any) === 'ADMIN' || (user?.role as any) === 'SUPER_ADMIN';
  } catch (error) {
    return false;
  }
}
