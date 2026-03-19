'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/lib/notifications'
import { logActivity } from './activity'

export async function createReport(data: {
  reporterId: string
  targetId: string
  jobId?: string
  reason: string
  description: string
  evidenceUrls?: string[]
}) {
  try {
    const report = await (prisma as any).platformReport.create({
      data: {
        ...data,
      }
    })
    revalidatePath('/dashboard/admin/reports')

    // Log Activity
    await logActivity({
      type: 'REPORT_SUBMITTED',
      content: `A new report was submitted by user ${data.reporterId}`,
      userId: data.reporterId,
      metadata: { reportId: report.id, reason: data.reason }
    });

    // Notify Admin (optional, but helpful for oversight)
    // In a real app, you'd find an admin user ID to notify
    console.log(`[ADMIN NOTIFICATION] New report submitted: ${report.id}`)

    return { success: true, reportId: report.id }
  } catch (error: any) {
    console.error('Create Report Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getReports() {
  try {
    const reports = await (prisma as any).platformReport.findMany({
      include: {
        reporter: true,
        target: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: reports }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
import { ensureAdmin, logAdminAction } from './auth'

export async function updateReportStatus(id: string, status: string, adminId: string = 'admin', adminNotes?: string) {
  try {
    await ensureAdmin(adminId)
    await (prisma as any).platformReport.update({
      where: { id },
      data: { status, adminNotes }
    })
    revalidatePath('/dashboard/admin/reports')
    await logAdminAction(adminId, `Updated report ${id} status to ${status}`, { reportId: id, status });
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function moderateUser(userId: string, action: 'WARN' | 'SUSPEND' | 'BAN', adminId: string = 'admin', reason?: string) {
  try {
    await ensureAdmin(adminId)
    const data: any = {}
    if (action === 'WARN') {
      data.warningCount = { increment: 1 }
    } else if (action === 'SUSPEND') {
      data.isSuspended = true
      data.suspensionReason = reason
    } else if (action === 'BAN') {
      data.isBanned = true
    }

    await (prisma as any).user.update({
      where: { id: userId },
      data
    })
    
    // Also revalidate relevant pages
    revalidatePath('/dashboard/admin/reports')
    revalidatePath('/dashboard/admin/workers')
    
    // Notify User
    let title = ''
    let body = ''
    if (action === 'WARN') {
        title = 'Account Warning'
        body = 'You have received a formal warning due to a platform policy violation.'
    } else if (action === 'SUSPEND') {
        title = 'Account Suspended'
        body = `Your account has been suspended. Reason: ${reason || 'Violation of terms'}.`
    } else if (action === 'BAN') {
        title = 'Account Banned'
        body = 'Your account has been permanently banned from Diwalya.'
    }

    await sendNotification({
        userId,
        title,
        body
    })

    await logAdminAction(adminId, `Moderated user ${userId}: ${action}`, { targetId: userId, action, reason });
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function liftSanctions(userId: string, adminId: string = 'admin') {
  try {
    await ensureAdmin(adminId)
    await (prisma as any).user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        isBanned: false,
        suspensionReason: null
      }
    })
    revalidatePath('/dashboard/admin/reports')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function checkUserStatus(email: string) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { email },
      select: { isBanned: true, isSuspended: true, suspensionReason: true }
    });
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
