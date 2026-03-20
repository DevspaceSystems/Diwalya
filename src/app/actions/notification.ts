'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { EMAIL_TEMPLATES, parseTemplate } from '@/lib/email-templates'
import { sendMulticastPush } from '@/lib/notifications'
import { ensureAdmin, logAdminAction } from './auth'

export async function sendMassBroadcast(data: {
  target: 'ALL' | 'WORKERS' | 'CLIENTS' | 'SELECTED'
  userIds?: string[]
  templateKey: keyof typeof EMAIL_TEMPLATES
  channels: { email: boolean, push: boolean }
  customSubject?: string
  customMessage?: string
  imageUrl?: string
  clickAction?: string
  adminId: string
}) {
  try {
    await ensureAdmin(data.adminId)
    
    // 1. Fetch recipients
    let query = supabaseAdmin.from('User').select('id, name, email, fcmToken');

    if (data.target === 'WORKERS') {
      query = query.eq('role', 'WORKER');
    } else if (data.target === 'CLIENTS') {
      query = query.eq('role', 'CLIENT');
    } else if (data.target === 'SELECTED' && data.userIds) {
      query = query.in('id', data.userIds);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) throw usersError;
    if (!users || users.length === 0) return { success: false, error: 'No recipients found' };

    const template = EMAIL_TEMPLATES[data.templateKey];
    const subject = data.customSubject || template.subject;
    const results: any = { email: null, push: null };

    // 2. Send Emails
    if (data.channels.email) {
      const emailPromises = users.map(async (user) => {
        const body = parseTemplate(template.body, {
          name: user.name,
          email: user.email,
          message: data.customMessage || ''
        });
        return sendEmail({ to: user.email, subject, body });
      });
      const emailResults = await Promise.all(emailPromises);
      results.email = { 
        total: users.length, 
        success: emailResults.filter(r => r.success).length 
      };
    }

    // 3. Send Push Notifications
    if (data.channels.push) {
      const tokens = users.map(u => u.fcmToken).filter(Boolean) as string[];
      if (tokens.length > 0) {
        const pushResult = await sendMulticastPush({
          tokens,
          title: subject,
          body: data.customMessage || template.body.split('\n')[0].replace('Hello {{name}},', '').trim() || 'Important Update',
          imageUrl: data.imageUrl,
          data: data.clickAction ? { url: data.clickAction } : {}
        });
        results.push = pushResult;
      } else {
        results.push = { success: true, count: 0, note: 'No tokens found' };
      }
    }

    await logAdminAction(data.adminId, `Sent mass broadcast to ${data.target}`, { 
      target: data.target, 
      template: data.templateKey,
      channels: data.channels,
      results 
    });
    return { success: true, results };

  } catch (error: any) {
    console.error('[BROADCAST ERROR]', error);
    return { success: false, error: error.message };
  }
}

export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('ActivityLog')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (error) throw error;
    
    return { success: true, data: data };
  } catch (error: any) {
    console.error('Get User Notifications Error:', error);
    return { success: false, error: error.message };
  }
}
