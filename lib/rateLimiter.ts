// Rate limiting utility to prevent API abuse and avoid service rate limits
interface RateLimitState {
  attempts: number
  lastAttempt: number
  blockedUntil: number
}

class RateLimiter {
  private storage: Map<string, RateLimitState> = new Map()
  
  constructor(
    private maxAttempts: number = 3,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private blockDurationMs: number = 30 * 60 * 1000 // 30 minutes
  ) {}

  // Check if action is allowed
  isAllowed(identifier: string): { allowed: boolean; retryAfter?: number; remainingAttempts?: number } {
    const now = Date.now()
    const state = this.storage.get(identifier) || { attempts: 0, lastAttempt: 0, blockedUntil: 0 }

    // Check if currently blocked
    if (state.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((state.blockedUntil - now) / 1000)
      }
    }

    // Reset attempts if window has passed
    if (now - state.lastAttempt > this.windowMs) {
      state.attempts = 0
    }

    // Check if attempts exceeded
    if (state.attempts >= this.maxAttempts) {
      state.blockedUntil = now + this.blockDurationMs
      this.storage.set(identifier, state)
      
      return {
        allowed: false,
        retryAfter: Math.ceil(this.blockDurationMs / 1000)
      }
    }

    // Allow action
    const remainingAttempts = this.maxAttempts - state.attempts - 1
    
    return {
      allowed: true,
      remainingAttempts
    }
  }

  // Record an attempt
  recordAttempt(identifier: string): void {
    const now = Date.now()
    const state = this.storage.get(identifier) || { attempts: 0, lastAttempt: 0, blockedUntil: 0 }
    
    state.attempts += 1
    state.lastAttempt = now
    this.storage.set(identifier, state)
  }

  // Reset rate limit for identifier
  reset(identifier: string): void {
    this.storage.delete(identifier)
  }

  // Get remaining time before next allowed attempt
  getTimeUntilNextAttempt(identifier: string): number {
    const state = this.storage.get(identifier)
    if (!state) return 0
    
    const now = Date.now()
    if (state.blockedUntil > now) {
      return state.blockedUntil - now
    }
    
    if (state.attempts >= this.maxAttempts) {
      return this.windowMs - (now - state.lastAttempt)
    }
    
    return 0
  }
}

// Create specific rate limiters for different actions
export const emailRateLimiter = new RateLimiter(
  2, // max 2 attempts
  5 * 60 * 1000, // per 5 minutes (shorter window)
  15 * 60 * 1000 // block for 15 minutes (not 60!)
)

export const loginRateLimiter = new RateLimiter(
  5, // max 5 attempts
  5 * 60 * 1000, // per 5 minutes
  15 * 60 * 1000 // block for 15 minutes
)

export const passwordResetRateLimiter = new RateLimiter(
  3, // max 3 attempts
  60 * 60 * 1000, // per hour
  60 * 60 * 1000 // block for 1 hour
)

// Helper functions for common rate limiting scenarios
export function checkEmailRateLimit(email: string) {
  return emailRateLimiter.isAllowed(email)
}

export function recordEmailAttempt(email: string) {
  emailRateLimiter.recordAttempt(email)
}

export function checkLoginRateLimit(ipOrEmail: string) {
  return loginRateLimiter.isAllowed(ipOrEmail)
}

export function recordLoginAttempt(ipOrEmail: string) {
  loginRateLimiter.recordAttempt(ipOrEmail)
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`
  return `${Math.ceil(seconds / 3600)} hours`
}
