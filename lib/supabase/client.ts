import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { isDevelopmentBypass } from '@/lib/devAuth'

let client: any = null

export function createClient() {
  if (client) return client

  // In development with bypass enabled, return a mock client
  if (isDevelopmentBypass() && typeof window !== 'undefined') {
    const mockUser = localStorage.getItem('dev-auth-user')
    const mockToken = localStorage.getItem('dev-auth-token')
    
    if (mockUser && mockToken) {
      client = createMockSupabaseClient(JSON.parse(mockUser), mockToken)
      return client
    }
  }
  
  client = createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}

function createMockSupabaseClient(mockUser: any, _mockToken: string) {
  const createQueryBuilder = () => {
    const builder: any = {
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
    from: () => createQueryBuilder(),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://mock-url.com/image.jpg' } })
      })
    }
  }
}