'use server'

import { supabaseAdmin } from './supabase-admin';
import { sendEmail } from './email';

/**
 * Centralized notification service for Diwalya.
 * Handles both Email (via SMTP) and Push Notifications (via Firebase).
 */

async function getFirebaseAdmin() {
  const admin = typeof window === 'undefined' ? eval('require')('firebase-admin') : null;
  if (!admin) return null;

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
      return null;
    }
  }
  return admin;
}

export async function sendNotification({
  userId,
  title,
  body,
  data = {},
  channels = ['email', 'push']
}: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channels?: ('email' | 'push')[];
}) {
  try {
    const admin = await getFirebaseAdmin();
    
    // Fetch user details using Supabase Admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('email, fcmToken, name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.warn(`[Notification] User ${userId} not found.`);
      return { success: false, error: 'User not found' };
    }

    const results: any = {};

    // 1. Email Channel
    if (channels.includes('email') && user.email) {
      results.email = await sendEmail({ to: user.email, subject: title, body });
    }

    // 2. Push Channel
    if (channels.includes('push')) {
      if (user.fcmToken && admin && process.env.FIREBASE_PROJECT_ID !== 'xxx') {
        try {
          const response = await admin.messaging().send({
            notification: { title, body },
            token: user.fcmToken,
            data: data,
          });
          results.push = { success: true, messageId: response };
        } catch (err: any) {
          results.push = { success: false, error: err.message };
        }
      } else {
        results.push = { success: true, mock: true, note: 'Token missing or admin uninitialized' };
      }
    }

    // Attempt to log notification in the database if there's a Notification table
    try {
       await supabaseAdmin.from('Notification').insert({
         id: `NOTIF-${Date.now()}`,
         userId,
         title,
         message: body,
         type: 'SYSTEM_ALERT',
         isRead: false
       });
    } catch (e) {
       // Silent fail if table doesn't exist or other error
    }

    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sends a notification to all administrators.
 */
export async function notifyAdmins({ title, body, data = {} }: { title: string, body: string, data?: any }) {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('role', 'ADMIN');

    if (error) throw error;
    if (!admins) return { success: true, count: 0 };

    const results = await Promise.all(
      admins.map(admin => sendNotification({ 
        userId: admin.id, 
        title: `[ADMIN] ${title}`, 
        body, 
        data,
        channels: ['email', 'push']
      }))
    );

    return { success: true, count: admins.length, results };
  } catch (error: any) {
    console.error('Notify Admins Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a multicast push notification to multiple tokens.
 */
export async function sendMulticastPush({
  tokens,
  title,
  body,
  imageUrl,
  data = {}
}: {
  tokens: string[];
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}) {
  try {
    const admin = await getFirebaseAdmin();
    if (!admin) return { success: false, error: 'Firebase Admin not initialized' };

    const validTokens = tokens.filter(t => t && t.length > 10);
    if (validTokens.length === 0) return { success: true, count: 0, note: 'No valid tokens' };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: validTokens,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {})
      },
      data: data
    });

    return { 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
