import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkEmailRateLimit, recordEmailAttempt, formatRetryAfter } from '@/lib/rateLimiter'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { id, name, email, role } = await request.json()
    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Server-side rate limit check
    const rateCheck = checkEmailRateLimit(email)
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        error: `Rate limit exceeded. Please try again in ${formatRetryAfter(rateCheck.retryAfter!)}` 
      }, { status: 429 })
    }

    // Record the attempt
    recordEmailAttempt(email)

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ id, name, email, role })
      .select()
      .single()

    if (error) {
      console.error('Service role insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (err) {
    console.error('Register POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
