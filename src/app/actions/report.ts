'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
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
    const { data: report, error } = await supabaseAdmin
      .from('PlatformReport')
      .insert({
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/admin/reports')

    // Log Activity
    await logActivity({
      type: 'REPORT_SUBMITTED',
      content: `A new report was submitted by user ${data.reporterId}`,
      userId: data.reporterId,
      metadata: { reportId: report.id, reason: data.reason }
    });

    // Notify Admin (optional, but helpful for oversight)
    console.log(`[ADMIN NOTIFICATION] New report submitted: ${report.id}`)

    return { success: true, reportId: report.id }
  } catch (error: any) {
    console.error('Create Report Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getReports() {
  try {
    const { data: reports, error } = await supabaseAdmin
      .from('PlatformReport')
      .select('*, reporter:User!PlatformReport_reporterId_fkey(*), target:User!PlatformReport_targetId_fkey(*)')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    // Transform to match Prisma's output (single object for 1-to-1 relations if necessary)
    // Supabase returns objects for single foreign keys by default if the relation is unique or 1-to-1,
    // but here we used aliases.
    const transformedTable = reports?.map(r => ({
      ...r,
      reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
      target: Array.isArray(r.target) ? r.target[0] : r.target
    }));

    return { success: true, data: transformedTable }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
import { ensureAdmin, logAdminAction } from './auth'

export async function updateReportStatus(id: string, status: string, adminId: string = 'admin', adminNotes?: string) {
  try {
    await ensureAdmin(adminId)
    const { error } = await supabaseAdmin
      .from('PlatformReport')
      .update({ status, adminNotes })
      .eq('id', id);

    if (error) throw error;

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
    const updateData: any = {}
    
    if (action === 'WARN') {
      // Fetch current warning count
      const { data: user } = await supabaseAdmin
        .from('User')
        .select('warningCount')
        .eq('id', userId)
        .single();
      
      updateData.warningCount = (user?.warningCount || 0) + 1;
    } else if (action === 'SUSPEND') {
      updateData.isSuspended = true
      updateData.suspensionReason = reason
    } else if (action === 'BAN') {
      updateData.isBanned = true
    }

    const { error } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
    
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
    const { error } = await supabaseAdmin
      .from('User')
      .update({
        isSuspended: false,
        isBanned: false,
        suspensionReason: null
      })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/dashboard/admin/reports')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function checkUserStatus(email: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('isBanned, isSuspended, suspensionReason')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
