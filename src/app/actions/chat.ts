'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Regex to detect common bypass attempts:
 * - Phone numbers (Ghanaian format)
 * - Emails
 * - External links
 * - Keywords: "call me", "whatsapp", "pay cash", "offline"
 */
const BYPASS_REGEX = /(?:\+?233|0)[235][0-9]{8}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[^\s]+|call me|whatsapp|pay cash|offline|outside/gi;

export async function sendMessage(data: {
  jobId: string
  senderId: string
  content: string
}) {
  try {
    // 1. Check for bypass attempts
    const isSuspicious = BYPASS_REGEX.test(data.content);
    if (isSuspicious) {
      return { 
        success: false, 
        error: 'Message blocked: For your protection, sharing phone numbers, emails, or links is not allowed before booking completion.' 
      };
    }

    // 2. Save Message
    const message = await (prisma as any).chatMessage.create({
      data: {
        jobId: data.jobId,
        senderId: data.senderId,
        content: data.content,
        isFlagged: false // No longer needed if we block, but keeping schema compatibility
      }
    });

    revalidatePath(`/dashboard/chat/${data.jobId}`);
    return { success: true, message };
  } catch (error: any) {
    console.error('Send Message Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getChatMessages(jobId: string) {
  try {
    const messages = await (prisma as any).chatMessage.findMany({
      where: { jobId },
      include: {
        sender: {
          select: { name: true, role: true, profilePicture: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return { success: true, data: messages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
