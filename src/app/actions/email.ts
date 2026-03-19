'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { EMAIL_TEMPLATES, parseTemplate } from '@/lib/email-templates'
import { Role } from '@prisma/client'

export async function sendMassEmail(data: {
  target: 'ALL' | 'WORKERS' | 'CLIENTS' | 'SELECTED'
  userIds?: string[]
  templateKey: keyof typeof EMAIL_TEMPLATES
  customSubject?: string
  customMessage?: string
}) {
  try {
    // 1. Fetch recipients
    let users: { id: string, name: string, email: string }[] = [];
    if (data.target === 'ALL') {
      users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
    } else if (data.target === 'WORKERS') {
      users = await prisma.user.findMany({ 
        where: { role: 'WORKER' },
        select: { id: true, name: true, email: true } 
      });
    } else if (data.target === 'CLIENTS') {
      users = await prisma.user.findMany({ 
        where: { role: 'CLIENT' },
        select: { id: true, name: true, email: true } 
      });
    } else if (data.target === 'SELECTED' && data.userIds) {
      users = await prisma.user.findMany({ 
        where: { id: { in: data.userIds } },
        select: { id: true, name: true, email: true } 
      });
    }

    if (users.length === 0) return { success: false, error: 'No recipients found' };

    // 2. Process template
    const template = EMAIL_TEMPLATES[data.templateKey];
    const subject = data.customSubject || template.subject;
    
    // 3. Send emails
    const results = await Promise.all(users.map(async (user) => {
        const body = parseTemplate(template.body, {
            name: user.name,
            email: user.email,
            message: data.customMessage || ''
        });

        return sendEmail({
            to: user.email,
            subject,
            body
        });
    }));

    const successCount = results.filter(r => r.success).length;
    return { success: true, count: successCount, total: users.length };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
