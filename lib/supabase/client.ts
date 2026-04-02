import { createBrowserClient } from '@supabase/ssr'
import { isDevelopmentBypass } from '@/lib/devAuth'

export function createClient() {
  // In development with bypass enabled, return a mock client
  if (isDevelopmentBypass() && typeof window !== 'undefined') {
    const mockUser = localStorage.getItem('dev-auth-user')
    const mockToken = localStorage.getItem('dev-auth-token')
    
    console.log('Mock client check - User:', mockUser, 'Token:', mockToken)
    
    if (mockUser && mockToken) {
      console.log('Creating mock Supabase client')
      return createMockSupabaseClient(JSON.parse(mockUser), mockToken)
    }
  }
  
  console.log('Creating real Supabase client')
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function createMockSupabaseClient(mockUser: any, mockToken: string) {
  const createQueryBuilder = () => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      ilike: () => builder,
      order: () => builder,
      range: () => builder,
      single: () => Promise.resolve({ data: mockUser, error: null }),
      maybeSingle: () => Promise.resolve({ data: mockUser, error: null }),
      data: [mockUser],
      error: null
    }
    return builder
  }

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      signUp: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      signOut: () => {
        localStorage.removeItem('dev-auth-user')
        localStorage.removeItem('dev-auth-token')
        return Promise.resolve({ error: null })
      },
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } }
      })
    },
    from: (table: string) => createQueryBuilder(),
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://mock-url.com/image.jpg' } })
      })
    }
  }
}