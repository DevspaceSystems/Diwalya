'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'

import { EMAIL_TEMPLATES, PUSH_TEMPLATES } from '@/lib/broadcast-templates'

// ─── BROADCAST EMAIL ACTION ───────────────────────────────────────────────────

export async function broadcastEmail(data: {
  templateId: string;
  targetGroup: 'ALL' | 'WORKERS' | 'CLIENTS' | 'SPECIFIC';
  customSubject?: string;
  customBody?: string;
  specificEmail?: string;
}) {
  try {
    const template = EMAIL_TEMPLATES.find(t => t.id === data.templateId);
    
    let users: { email: string; name: string }[] = [];

    if (data.targetGroup === 'SPECIFIC' && data.specificEmail) {
      users = [{ email: data.specificEmail, name: 'User' }];
    } else {
      let query = supabaseAdmin.from('User').select('email, name');
      if (data.targetGroup === 'WORKERS') query = query.eq('role', 'WORKER');
      if (data.targetGroup === 'CLIENTS') query = query.eq('role', 'CLIENT');
      
      const { data: fetchedUsers, error } = await query;
      if (error) throw error;
      users = fetchedUsers || [];
    }

    const results = [];
    for (const user of users) {
      const subject = data.templateId === 'CUSTOM' 
        ? (data.customSubject || 'Message from Diwalya')
        : (template?.subject || 'Message from Diwalya');
      
      const body = data.templateId === 'CUSTOM'
        ? (data.customBody || '')
        : (template?.body(user.name) || '');

      const result = await sendEmail({ to: user.email, subject, body });
      results.push({ email: user.email, ...result });
    }

    return { success: true, sent: results.length, results };
  } catch (error: any) {
    console.error('Broadcast Email Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── BROADCAST EMAIL ACTION ───────────────────────────────────────────────────

export async function broadcastPushNotification(data: {
  templateId: string;
  targetGroup: 'ALL' | 'WORKERS' | 'CLIENTS';
  customTitle?: string;
  customBody?: string;
}) {
  try {
    const template = PUSH_TEMPLATES.find(t => t.id === data.templateId);
    
    const title = data.templateId === 'CUSTOM' ? (data.customTitle || 'Diwalya') : template?.title || 'Diwalya';
    const body = data.templateId === 'CUSTOM' ? (data.customBody || '') : template?.body || '';

    // Use Supabase directly to avoid Prisma connection issues
    let query = supabaseAdmin.from('User').select('id, name, fcmToken');
    if (data.targetGroup === 'WORKERS') query = query.eq('role', 'WORKER');
    if (data.targetGroup === 'CLIENTS') query = query.eq('role', 'CLIENT');
    
    const { data: users, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    const usersWithToken = (users || []).filter((u: any) => u.fcmToken);

    // Send in-app notification record for all users
    const notifInserts = (users || []).map((user: any) => ({
      id: `NOTIF-${Date.now()}-${user.id.slice(0, 8)}`,
      userId: user.id,
      title,
      message: body,
      type: 'ADMIN_BROADCAST',
      isRead: false
    }));

    if (notifInserts.length > 0) {
      await supabaseAdmin.from('Notification').insert(notifInserts);
    }

    // Send Firebase push if tokens exist
    let firebaseSent = 0;
    if (usersWithToken.length > 0) {
      try {
        const admin = eval('require')('firebase-admin');
        if (admin?.messaging) {
          const tokens = usersWithToken.map((u: any) => u.fcmToken);
          await admin.messaging().sendEachForMulticast({ tokens, notification: { title, body } });
          firebaseSent = tokens.length;
        }
      } catch (e) {
        // Firebase not initialized, in-app only
      }
    }

    return { 
      success: true, 
      totalUsers: users?.length || 0,
      inAppSent: notifInserts.length,
      pushSent: firebaseSent 
    };
  } catch (error: any) {
    console.error('Broadcast Push Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── WELCOME NOTIFICATION ON SIGNUP ──────────────────────────────────────────

export async function sendWelcomeNotification(userId: string, name: string, email: string, role: string) {
  try {
    console.log(`[sendWelcomeNotification] Syncing user ${email} (${userId}) to DB...`);

    // Check for ghost records with the same email but different ID
    const { data: conflictUser } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (conflictUser) {
      console.warn(`[sendWelcomeNotification] Found ghost record for email ${email} with ID ${conflictUser.id}. Removing...`);
      await supabaseAdmin.from('User').delete().eq('id', conflictUser.id);
    }

    // 0. Ensure user exists in handle_new_user (Fallback for Trigger)
    const { error: syncError } = await supabaseAdmin.from('User').upsert({
      id: userId,
      email: email,
      name: name,
      role: role,
      updatedAt: new Date().toISOString()
    }, { onConflict: 'id' });

    if (syncError) {
      console.error('[sendWelcomeNotification] Sync Error:', syncError);
      // Don't throw here to ensure email attempts continue, but it will be caught in onboarding if it fails again
    } else {
      // Also ensure a wallet exists
      await supabaseAdmin.from('Wallet').upsert({
        userId: userId,
        balance: 0,
        currency: 'GHS'
      }, { onConflict: 'userId' });
    }

    const roleName = role === 'WORKER' ? 'Professional' : 'Client';
    const title = `Welcome to Diwalya, ${name}! 🎉`;
    const message = `We're excited to have you as a ${roleName}. Start exploring the platform and let's get to work!`;

    // 1. Create in-app notification
    await supabaseAdmin.from('Notification').insert({
      id: `NOTIF-WELCOME-${userId}`,
      userId,
      title,
      message,
      type: 'SYSTEM_ALERT',
      isRead: false
    });

    // 2. Send welcome email via Hostinger SMTP
    const template = EMAIL_TEMPLATES.find(t => t.id === 'WELCOME');
    if (template && email) {
      // Fire and forget email to avoid blocking the signup request
      sendEmail({
        to: email,
        subject: template.subject,
        body: template.body(name),
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fff;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://diwalya.com/diwalya-logo.png" alt="Diwalya" height="40" style="object-fit: contain;" />
            </div>
            <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Hey ${name}, welcome! 🎉</h1>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              You've joined Ghana's #1 trusted marketplace for skilled workers. We're thrilled to have you on board as a <strong>${roleName}</strong>.
            </p>
            <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">What you can do now:</p>
              <ul style="color: #475569; font-size: 15px; line-height: 2; padding-left: 20px; margin: 0;">
                <li>${role === 'WORKER' ? 'Complete your professional profile' : 'Browse qualified workers near you'}</li>
                <li>${role === 'WORKER' ? 'Submit your verification documents' : 'Request a site inspection'}</li>
                <li>${role === 'WORKER' ? 'Accept jobs and update progress' : 'Track jobs in real-time'}</li>
                <li>Receive secure, escrow-protected payments</li>
              </ul>
            </div>
            <a href="https://diwalya.com" style="display: inline-block; background: #2563eb; color: white; font-weight: 900; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px;">
              Get Started →
            </a>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Diwalya Limited &bull; info@diwalya.com &bull; Ghana
            </p>
          </div>
        `
      }).catch(err => console.error('[SIGNUP EMAIL ERROR]', err));
    }

    return { success: true };
  } catch (error: any) {
    console.error('Welcome notification error:', error);
    return { success: false, error: error.message };
  }
}
