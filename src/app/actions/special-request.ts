'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function createSpecialRequest(data: {
  userId: string
  serviceType: string
  description: string
  location: string
  preferredTime: Date
  budget?: number
}) {
  try {
    const { data: request, error } = await supabaseAdmin
      .from('SpecialRequest')
      .insert({
        userId: data.userId,
        serviceType: data.serviceType,
        description: data.description,
        location: data.location,
        preferredTime: data.preferredTime.toISOString(),
        budget: data.budget,
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/admin/special-requests')
    return { success: true, data: request }
  } catch (error: any) {
    console.error('Create Special Request Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getSpecialRequests() {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('SpecialRequest')
      .select('*, user:User(*)')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    // Transform to match Prisma's output (single object for 1-to-1)
    const transformedRequests = requests?.map(r => ({
      ...r,
      user: Array.isArray(r.user) ? r.user[0] : r.user
    }));

    return { success: true, data: transformedRequests }
  } catch (error: any) {
    console.error('Get Special Requests Error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSpecialRequestStatus(
  requestId: string, 
  status: string, 
  adminNotes?: string,
  assignedWorkerId?: string
) {
  try {
    const { data: request, error } = await supabaseAdmin
      .from('SpecialRequest')
      .update({ 
        status, 
        adminNotes,
        assignedWorkerId
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/admin/special-requests')
    return { success: true, data: request }
  } catch (error: any) {
    console.error('Update Special Request Error:', error)
    return { success: false, error: error.message }
  }
}
