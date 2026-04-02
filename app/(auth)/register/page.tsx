'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { checkEmailRateLimit, recordEmailAttempt, formatRetryAfter } from '@/lib/rateLimiter'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'viewer' | 'author'>('viewer')
  const [rateLimitInfo, setRateLimitInfo] = useState<{ allowed: boolean; retryAfter?: number; remainingAttempts?: number } | null>(null)

  // Check rate limit on email change
  useEffect(() => {
    if (email) {
      const check = checkEmailRateLimit(email)
      setRateLimitInfo(check)
    } else {
      setRateLimitInfo(null)
    }
  }, [email])

  async function handleRegister() {
    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // Check rate limit
    const rateCheck = checkEmailRateLimit(email)
    if (!rateCheck.allowed) {
      toast.error(`Rate limit exceeded. Please try again in ${formatRetryAfter(rateCheck.retryAfter!)}`)
      return
    }

    setLoading(true)
    recordEmailAttempt(email)
    const supabase = createClient()

    // Step 1: Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      toast.error('Signup failed, please try again')
      setLoading(false)
      return
    }

    // Step 2: Create profile server-side via admin API to avoid RLS issues
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.user.id, name, email, role }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        console.error('Profile service error:', json)
        toast.error('Account created but profile setup failed')
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Profile service exception:', err)
      toast.error('Account created but profile setup failed')
      setLoading(false)
      return
    }

    toast.success('Account created successfully!')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Join Hivon Blog as a reader or writer
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={rateLimitInfo && !rateLimitInfo.allowed ? 'border-red-500' : ''}
            />
            {rateLimitInfo && !rateLimitInfo.allowed && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <p className="font-medium">⚠️ Rate limit exceeded</p>
                <p>Please try again in {formatRetryAfter(rateLimitInfo.retryAfter!)}</p>
              </div>
            )}
            {rateLimitInfo && rateLimitInfo.allowed && rateLimitInfo.remainingAttempts !== undefined && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                <p>{rateLimitInfo.remainingAttempts} attempts remaining before rate limit</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">I want to join as a...</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setRole('viewer')}
                className={
                  'p-3 rounded-lg border-2 text-sm font-medium text-center cursor-pointer transition-all ' +
                  (role === 'viewer'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300')
                }
              >
                👀 Reader
              </div>
              <div
                onClick={() => setRole('author')}
                className={
                  'p-3 rounded-lg border-2 text-sm font-medium text-center cursor-pointer transition-all ' +
                  (role === 'author'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300')
                }
              >
                ✍️ Author
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Selected: <span className="font-medium capitalize">{role}</span>
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleRegister}
            disabled={loading || (rateLimitInfo?.allowed === false)}
          >
            {loading ? 'Creating account...' : 
             rateLimitInfo && !rateLimitInfo.allowed ? 'Rate Limited' : 
             'Create Account'}
          </Button>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}