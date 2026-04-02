import { createClient } from '@supabase/supabase-js'

// Service role client for admin operations (bypasses RLS)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin credentials')
  }
  
  console.log('🔍 Creating admin client with URL:', url)
  console.log('🔍 Service key length:', serviceKey.length)
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
