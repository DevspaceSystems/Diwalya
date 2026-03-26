'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

/**
 * Regex to detect common bypass attempts:
 * - Phone numbers (Ghanaian format: must be exactly 10 digits starting with 02x, 03x, or 05x)
 * - Emails
 * - External links
 * - Clear bypass keywords
 *
 * NOTE: No 'g' flag — using global flag with .test() causes alternating true/false results
 * due to lastIndex state on the regex object, which caused every other message to be blocked.
 */
const BYPASS_REGEX = /(?:(?:\+?233|0)[235]\d{8}(?!\d))|(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(?:https?:\/\/[^\s]+)|(?:\bcall me\b|\bwhatsapp\b|\bpay cash\b)/i;

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
        blocked: true,
        error: 'Message blocked: For your protection, sharing phone numbers, emails, or links is not allowed before booking completion.'
      };
    }

    // 2. Save Message
    const isForAdmin = data.recipientId === 'admin' || (!data.recipientId && !data.jobId);
    
    const { data: message, error } = await supabaseAdmin
      .from('ChatMessage')
      .insert({
        id: crypto.randomUUID(),
        jobId: data.jobId || null,
        senderId: data.senderId,
        recipientId: isForAdmin ? null : data.recipientId,
        content: data.content,
        isFlagged: false
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Send Push Notification to Recipient
    try {
      let targetUserId = isForAdmin ? 'admin' : data.recipientId;
      if (!targetUserId && data.jobId) {
        // If we don't have explicit recipient, find the other party in the job
        const { data: job } = await supabaseAdmin.from('Job').select('clientId, workerId').eq('id', data.jobId).single();
        if (job) {
          targetUserId = (job.clientId === data.senderId) ? job.workerId : job.clientId;
        }
      }

      const { data: sender } = await supabaseAdmin.from('User').select('name').eq('id', data.senderId).single();
      const { data: recipient } = targetUserId !== 'admin' ? await supabaseAdmin.from('User').select('role').eq('id', targetUserId).single() : { data: null };
      const { sendNotification, notifyAdmins } = await import('@/lib/notifications');

      if (targetUserId === 'admin') {
         await notifyAdmins({
           title: `Support Message from ${sender?.name || 'User'}`,
           body: data.content,
           data: { source: 'admin_chat' }
         });
      } else if (targetUserId) {
        let redirectUrl = '/';
        if (data.jobId) {
           redirectUrl = `/dashboard/chat/${data.jobId}`;
        } else if (recipient?.role === 'WORKER') {
           redirectUrl = `/dashboard/worker/messages`;
        } else {
           // For clients without a job, they chat on the worker's profile
           redirectUrl = `/worker/${data.senderId}`;
        }

        await sendNotification({
          userId: targetUserId,
          title: `New message from ${sender?.name || 'Someone'}`,
          body: data.content.length > 60 ? data.content.substring(0, 57) + '...' : data.content,
          data: { url: redirectUrl }
        });
      }
    } catch (notifErr) {
      console.error('Failed to send chat notification:', notifErr);
      // Suppress notification errors so the message still succeeds
    }

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
