import { createClient } from '@supabase/supabase-js'

// Service role client for admin operations (bypasses RLS)
export function createAdminClient() {
  // Prefer non-public URL variable for server usage. Fall back for backwards compatibility.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  // Avoid logging secrets in production; these logs are helpful in dev only
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 Creating admin client with URL:', url)
    console.log('🔍 Service key length:', serviceKey.length)
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
