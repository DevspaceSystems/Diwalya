'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { EMAIL_TEMPLATES, parseTemplate } from '@/lib/email-templates'

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
    
    let query = supabaseAdmin.from('User').select('id, name, email');

    if (data.target === 'ALL') {
      const { data: fetched, error } = await query;
      if (error) throw error;
      users = fetched || [];
    } else if (data.target === 'WORKERS') {
      const { data: fetched, error } = await query.eq('role', 'WORKER');
      if (error) throw error;
      users = fetched || [];
    } else if (data.target === 'CLIENTS') {
      const { data: fetched, error } = await query.eq('role', 'CLIENT');
      if (error) throw error;
      users = fetched || [];
    } else if (data.target === 'SELECTED' && data.userIds) {
      const { data: fetched, error } = await query.in('id', data.userIds);
      if (error) throw error;
      users = fetched || [];
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
    console.error('sendMassEmail Error:', error);
    return { success: false, error: error.message };
  }
}
