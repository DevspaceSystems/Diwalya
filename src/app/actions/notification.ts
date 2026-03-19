'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail, EMAIL_TEMPLATES, parseTemplate } from '@/lib/email'
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
    let users: { id: string, name: string, email: string, fcmToken: string | null }[] = [];
    const selection = { id: true, name: true, email: true, fcmToken: true };

    if (data.target === 'ALL') {
      users = await prisma.user.findMany({ select: selection as any }) as any;
    } else if (data.target === 'WORKERS') {
      users = await prisma.user.findMany({ 
        where: { role: 'WORKER' },
        select: selection as any
      }) as any;
    } else if (data.target === 'CLIENTS') {
      users = await prisma.user.findMany({ 
        where: { role: 'CLIENT' },
        select: selection as any
      }) as any;
    } else if (data.target === 'SELECTED' && data.userIds) {
      users = await prisma.user.findMany({ 
        where: { id: { in: data.userIds } },
        select: selection as any
      }) as any;
    }

    if (users.length === 0) return { success: false, error: 'No recipients found' };

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
