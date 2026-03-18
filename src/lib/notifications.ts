import { prisma } from './prisma';
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
    const admin = typeof window === 'undefined' ? eval('require')('firebase-admin') : null;
    if (!admin) return { success: false, error: 'Internal Server Error' };

    // Initialize Firebase Admin SDK
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
      }
    }

    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fcmToken: true, name: true } as any
    });

    if (!user) {
      console.warn(`[Notification] User ${userId} not found.`);
      return { success: false, error: 'User not found' };
    }

    const results: any = {};

    // 1. Send Email Notification
    if (channels.includes('email') && process.env.RESEND_API_KEY !== 're_xxx') {
      try {
        // Mocking Resend for now (until API key is real)
        console.log(`[EMAIL] To: ${user.email} | Subject: ${title} | Body: ${body}`);
        results.email = { success: true, provider: 'resend-mock' };
      } catch (err: any) {
        console.error(`[EMAIL Error] ${err.message}`);
        results.email = { success: false, error: err.message };
      }
    } else if (channels.includes('email')) {
      console.log(`[EMAIL MOCK] To: ${user.email} | Subject: ${title} | Body: ${body}`);
      results.email = { success: true, mock: true };
    }

    // 2. Send Push Notification (Firebase)
    if (channels.includes('push') && user.fcmToken && process.env.FIREBASE_PROJECT_ID !== 'xxx') {
      try {
        const message = {
          notification: { title, body },
          token: user.fcmToken,
          data: data,
        };

        const responseAddress = await admin.messaging().send(message);
        console.log(`[PUSH SUCCESS] Message sent to ${user.name}: ${responseAddress}`);
        results.push = { success: true, messageId: responseAddress };
      } catch (err: any) {
        console.error(`[PUSH Error] Sending to dev: ${err.message}`);
        results.push = { success: false, error: err.message };
      }
    } else if (channels.includes('push')) {
      if (user.fcmToken) {
        console.log(`[PUSH MOCK] To Token: ${user.fcmToken} | Title: ${title} | Body: ${body}`);
        results.push = { success: true, mock: true };
      } else {
        console.log(`[PUSH] Skipped: No FCM token for user ${user.name}`);
        results.push = { success: false, error: 'No FCM token' };
      }
    }

    return { success: true, results };
  } catch (error: any) {
    console.error(`[Notification System Error] ${error.message}`);
    return { success: false, error: error.message };
  }
}
