'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
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
  jobId?: string
  senderId: string
  content: string
  recipientId?: string
}) {
  try {
    // 1. Check for bypass attempts
    const isSuspicious = BYPASS_REGEX.test(data.content);
    if (isSuspicious) {
      // Log the warning to the user's account
      const { data: userData, error: userError } = await supabaseAdmin
        .from('User')
        .select('warningCount')
        .eq('id', data.senderId)
        .single();
      
      if (!userError) {
        await supabaseAdmin
            .from('User')
            .update({ warningCount: (userData.warningCount || 0) + 1 })
            .eq('id', data.senderId);
      }

      return { 
        success: false, 
        error: 'Message blocked: For your protection, sharing phone numbers, emails, or links is not allowed before booking completion. A warning has been logged to your account.' 
      };
    }

    // 2. Save Message
    const { data: message, error } = await supabaseAdmin
      .from('ChatMessage')
      .insert({
        jobId: data.jobId || null,
        senderId: data.senderId,
        recipientId: data.recipientId || (data.jobId ? null : 'admin'),
        content: data.content,
        isFlagged: false
      })
      .select()
      .single();

    if (error) throw error;

    if (data.jobId) {
      revalidatePath(`/dashboard/chat/${data.jobId}`);
    }
    revalidatePath(`/dashboard/worker/messages`);
    
    return { success: true, message };
  } catch (error: any) {
    console.log('Send Message Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getChatMessages(jobId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('ChatMessage')
      .select('*, sender:User(name, role, profilePicture)')
      .eq('jobId', jobId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
