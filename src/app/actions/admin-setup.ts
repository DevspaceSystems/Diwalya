import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use Service Role client for admin operations if possible
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Generates a one-time admin setup token.
 */
export async function generateAdminToken(email?: string) {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

  const { data, error } = await supabaseAdmin
    .from('AdminToken')
    .insert([{
      id: uuidv4(),
      token,
      email,
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
      createdAt: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Validates an admin setup token.
 */
export async function validateAdminToken(token: string) {
  const { data: adminToken, error } = await supabaseAdmin
    .from('AdminToken')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !adminToken) return { success: false, message: 'Invalid token.' };
  if (adminToken.isUsed) return { success: false, message: 'Token already used.' };
  if (new Date() > new Date(adminToken.expiresAt)) return { success: false, message: 'Token expired.' };

  return { success: true, token: adminToken };
}

/**
 * Marks an admin token as used.
 */
export async function consumeAdminToken(token: string) {
  const { error } = await supabaseAdmin
    .from('AdminToken')
    .update({ isUsed: true })
    .eq('token', token);
  
  if (error) throw error;
}
