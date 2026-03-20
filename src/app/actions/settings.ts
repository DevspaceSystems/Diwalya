'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { ensureAdmin, logAdminAction } from './auth'

export async function getSettings() {
  try {
    let { data: settings, error: fetchError } = await supabaseAdmin
      .from('SystemSettings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw fetchError;
    }

    if (!settings) {
      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('SystemSettings')
        .insert({
          id: 'default',
          inspectionFee: 100.0,
          inspectionWorkerShare: 60.0
        })
        .select()
        .single();
      
      if (createError) throw createError;
      settings = newSettings;
    }

    return { success: true, data: settings }
  } catch (error: any) {
    console.error('getSettings Error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSettings(
  adminId: string,
  data: {
    inspectionFee?: number
    inspectionWorkerShare?: number
  }
) {
  try {
    await ensureAdmin(adminId)

    const { data: updated, error } = await supabaseAdmin
      .from('SystemSettings')
      .update(data)
      .eq('id', 'default')
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(adminId, 'Updated system settings', data)

    return { success: true, data: updated }
  } catch (error: any) {
    console.error('updateSettings Error:', error)
    return { success: false, error: error.message }
  }
}
