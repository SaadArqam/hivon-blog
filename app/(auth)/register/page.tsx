'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { checkEmailRateLimit, recordEmailAttempt, formatRetryAfter } from '@/lib/rateLimiter'
import { bypassSupabaseAuth, isDevelopmentBypass } from '@/lib/devAuth'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'viewer' | 'author'>('viewer')
  const rateLimitInfo = email ? checkEmailRateLimit(email) : null

  async function handleRegister() {
    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    const rateCheck = checkEmailRateLimit(email)
    
    if (!rateCheck.allowed) {
      if (isDevelopmentBypass()) {
        setLoading(true)
        const bypassResult = await bypassSupabaseAuth(email, password, name, role)
        if (bypassResult) {
          toast.success('Account created successfully!')
          router.push('/')
          router.refresh()
          return
        } else {
          setLoading(false)
          return
        }
      }
      
      toast.error(`Rate limit exceeded. Please try again in ${formatRetryAfter(rateCheck.retryAfter!)}`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    recordEmailAttempt(email)

    const signUpResult = await supabase.auth.signUp({ email, password })
    if (signUpResult.error) {
      toast.error(signUpResult.error.message)
      setLoading(false)
      return
    }

    const createdUser = signUpResult.data?.user as { id?: string } | undefined
    if (!createdUser || !createdUser.id) {
      toast.error('Signup failed, please try again')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createdUser.id, name, email, role }),
      })
      if (!res.ok) {
        toast.error('Account created but profile setup failed')
        setLoading(false)
        return
      }
    } catch (err) {
      toast.error('Account created but profile setup failed')
      setLoading(false)
      return
    }

    toast.success('Account created successfully!')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Join Hivon.</h1>
          <p className="text-gray-500 text-sm">
            Become a part of the next generation of professional publishing.
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Full Name</label>
              <Input
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                className="h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Email Address</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">I want to be a...</label>
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                   onClick={() => setRole('viewer')}
                   disabled={loading}
                   className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${role === 'viewer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Reader
                </button>
                <button
                   onClick={() => setRole('author')}
                   disabled={loading}
                   className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${role === 'author' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Author
                </button>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
            onClick={handleRegister}
            disabled={loading || (rateLimitInfo?.allowed === false)}
          >
            {loading ? '...' : 'Create Account'}
          </Button>

          <footer className="text-center">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-gray-900 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
          </footer>
        </div>
      </div>
    </div>
  )
}