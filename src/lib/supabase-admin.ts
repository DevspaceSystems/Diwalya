import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase Admin credentials are missing. Check your .env file.')
}

// Admin client for server-side only (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
