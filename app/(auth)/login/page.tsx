'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { checkLoginRateLimit, recordLoginAttempt, formatRetryAfter } from '@/lib/rateLimiter'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const rateLimitInfo = form.email ? checkLoginRateLimit(form.email) : null

  async function handleLogin() {
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Sign in.</h1>
          <p className="text-gray-500 text-sm">
            Welcome back to the Hivon publishing platform.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Email Address</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className={`h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:bg-white transition-all ${rateLimitInfo && !rateLimitInfo.allowed ? 'border-red-200' : ''}`}
              />
              {rateLimitInfo && !rateLimitInfo.allowed && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-500 text-center pt-1">
                  Wait {formatRetryAfter(rateLimitInfo.retryAfter!)}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:bg-white transition-all"
              />
            </div>
          </div>

          <Button
            className="w-full h-12 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
            onClick={handleLogin}
            disabled={loading || (rateLimitInfo?.allowed === false)}
          >
            {loading ? '...' : 'Sign In'}
          </Button>

          <footer className="text-center pt-6">
              <p className="text-xs text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-gray-900 font-bold hover:underline">
                  Sign up free
                </Link>
              </p>
          </footer>
        </div>
      </div>
    </div>
  )
}