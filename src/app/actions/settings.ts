'use server'

import { prisma } from '@/lib/prisma'
import { ensureAdmin, logAdminAction } from './auth'

export async function getSettings() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          inspectionFee: 100.0,
          inspectionWorkerShare: 60.0
        }
      })
    }

    return { success: true, data: settings }
  } catch (error: any) {
    console.error('getSettings Error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSettings(
  adminId: string,
  data: {
    inspectionFee?: number
    inspectionWorkerShare?: number
  }
) {
  try {
    await ensureAdmin(adminId)

    const updated = await prisma.systemSettings.update({
      where: { id: 'default' },
      data
    })

    await logAdminAction(adminId, 'Updated system settings', data)

    return { success: true, data: updated }
  } catch (error: any) {
    console.error('updateSettings Error:', error)
    return { success: false, error: error.message }
  }
}
