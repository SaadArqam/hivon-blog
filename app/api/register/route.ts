import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
