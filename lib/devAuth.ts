// Development-only auth bypass for testing when rate limits are hit
export function isDevelopmentBypass() {
  return process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_BYPASS === 'true'
}

export function createMockUser(email: string, name: string, role: string) {
  return {
    id: `dev-${Date.now()}`,
    email,
    name,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export async function bypassSupabaseAuth(email: string, password: string, name: string, role: string) {
  if (!isDevelopmentBypass()) {
    return null
  }
  
  // Create mock user data
  const mockUser = createMockUser(email, name, role)
  
  // Store in localStorage for persistence during development
  if (typeof window !== 'undefined') {
    localStorage.setItem('dev-auth-user', JSON.stringify(mockUser))
    localStorage.setItem('dev-auth-token', `dev-token-${Date.now()}`)
  }
  
  return {
    user: mockUser,
    session: {
      access_token: `dev-token-${Date.now()}`,
      refresh_token: `dev-refresh-${Date.now()}`,
      user: mockUser,
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
  }
}
