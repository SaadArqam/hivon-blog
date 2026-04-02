'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { checkLoginRateLimit, recordLoginAttempt, formatRetryAfter } from '@/lib/rateLimiter'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [rateLimitInfo, setRateLimitInfo] = useState<{ allowed: boolean; retryAfter?: number; remainingAttempts?: number } | null>(null)

  // Check rate limit on email change
  useEffect(() => {
    if (form.email) {
      const check = checkLoginRateLimit(form.email)
      setRateLimitInfo(check)
    } else {
      setRateLimitInfo(null)
    }
  }, [form.email])

  async function handleLogin() {
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }

    // Check rate limit
    const rateCheck = checkLoginRateLimit(form.email)
    if (!rateCheck.allowed) {
      toast.error(`Too many login attempts. Please try again in ${formatRetryAfter(rateCheck.retryAfter!)}`)
      return
    }

    setLoading(true)
    recordLoginAttempt(form.email)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      toast.error('Invalid email or password')
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push('/')
    router.refresh()
  }

  // Allow pressing Enter to submit
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your Hivon Blog account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={handleKeyDown}
              className={rateLimitInfo && !rateLimitInfo.allowed ? 'border-red-500' : ''}
            />
            {rateLimitInfo && !rateLimitInfo.allowed && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <p className="font-medium">⚠️ Too many login attempts</p>
                <p>Please try again in {formatRetryAfter(rateLimitInfo.retryAfter!)}</p>
              </div>
            )}
            {rateLimitInfo && rateLimitInfo.allowed && rateLimitInfo.remainingAttempts !== undefined && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                <p>{rateLimitInfo.remainingAttempts} attempts remaining</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loading || (rateLimitInfo?.allowed === false)}
          >
            {loading ? 'Signing in...' : 
             rateLimitInfo?.allowed === false ? 'Rate Limited' : 
             'Sign In'}
          </Button>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}