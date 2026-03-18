'use server'

import { prisma } from '@/lib/prisma'
// import { ActivityType } from '@prisma/client'
export async function logActivity(data: {
  type: any
  content: string
  userId?: string
  metadata?: any
}) {
  try {
    const admin = typeof window === 'undefined' ? eval('require')('firebase-admin') : null;
    if (!admin) return { success: false, error: 'Internal Server Error' };

    // Initialize Firebase Admin if not already
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
          databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        });
      } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
      }
    }

    // 1. Save to Prisma
    const log = await (prisma as any).activityLog.create({
      data: {
        type: data.type,
        content: data.content,
        userId: data.userId,
        metadata: data.metadata
      }
    });

    // 2. Push to Firebase Realtime Database for "Live Feed"
    try {
      const db = admin.database();
      const ref = db.ref('activities');
      await ref.push({
        ...log,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
    } catch (firebaseError: any) {
      console.error('Firebase Realtime Logging Error:', firebaseError.message);
    }

    return { success: true, log };
  } catch (error: any) {
    console.error('Log Activity Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getRecentActivities(limit = 20) {
  try {
    const activities = await (prisma as any).activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, role: true, profilePicture: true }
        }
      }
    });
    return { success: true, data: activities };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
