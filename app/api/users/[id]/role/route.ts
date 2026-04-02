import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateRequest } from '@/lib/validation'
import { z } from 'zod'

const roleUpdateSchema = z.object({
  role: z.enum(['viewer', 'author', 'admin'])
})

// Prefer createAdminClient wrapper which uses server-side env vars and safer defaults
const supabaseAdmin = createAdminClient()

export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { role } = validateRequest(roleUpdateSchema, await request.json())

    // Check if requester is admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requester is admin
    const { data: requesterProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!requesterProfile || requesterProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update user role
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Role update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })

  } catch (error) {
    console.error('Role update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
