'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getUsers(query?: string, role?: string) {
  try {
    const users = await prisma.user.findMany({
      where: {
        ...(query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { id: { contains: query, mode: 'insensitive' } }
          ]
        } : {}),
        ...(role ? { role: role as any } : {})
      },
      include: {
        workerProfile: true,
        wallet: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWorkers() {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      include: { workerProfile: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: workers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function updateUser(userId: string, data: any) {
  try {
    const user = await (prisma as any).user.update({
      where: { id: userId },
      data
    });
    revalidatePath('/dashboard/admin/users');
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
