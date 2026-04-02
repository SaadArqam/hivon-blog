import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { postUpdateSchema, validateRequest } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // We use the anon client for read to verify visibility
    const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
    if (!post) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    const role = profile?.role
    const isOwner = post.author_id === user.id
    if (!(isOwner || role === 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates = validateRequest(postUpdateSchema, await request.json())

    if (updates.title && updates.title !== post.title) {
      let newSlug = slugify(updates.title)
      const { data: existing } = await supabase.from('posts').select('id').eq('slug', newSlug).maybeSingle()
      if (existing && existing.id !== post.id) {
        newSlug = `${newSlug}-${Date.now()}`
      }
      updates.slug = newSlug
    }
    
    updates.updated_at = new Date().toISOString()

    // Using admin client for update to ensure we don't have RLS issues for admins
    const adminSupabase = createAdminClient()
    const { data: updated, error } = await adminSupabase.from('posts').update(updates).eq('id', id).select().maybeSingle()
    
    if (error) {
      console.error('Post update error:', error)
      return NextResponse.json({ error: 'Failed to apply updates' }, { status: 500 })
    }

    return NextResponse.json({ post: updated })
  } catch (err) {
    console.error('PATCH /api/posts/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    
    console.log('🔍 INITIATING DELETE ACTION:', { id })
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 })

    // 1. Fetch metadata first to check ownership/role
    // We use the anon client for fetch to respect visibility
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, author_id, title')
      .eq('id', id)
      .maybeSingle()
    
    if (fetchError) {
      console.error('🔍 FETCH FAILED:', fetchError.message)
      return NextResponse.json({ error: 'Database mismatch while verifying post.' }, { status: 500 })
    }

    if (!post) {
      console.log('🔍 DELETE ABORTED: Target post not found.', { id })
      return NextResponse.json({ error: 'Target record does not exist.' }, { status: 404 })
    }

    // 2. Perform application-level authorization validation
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    const role = profile?.role
    const isOwner = post.author_id === user.id
    
    if (!(isOwner || role === 'admin')) {
        console.log('🔍 FORBIDDEN ATTEMPT:', { userId: user.id, postAuthorId: post.author_id, role })
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Perform actual deletion using Admin Client
    // This bypasses RLS policies that might be incorrectly defined for specific roles,
    // ensuring that our manual authorization check in Step 2 is the source of truth.
    const adminSupabase = createAdminClient()
    
    const { data: deletedRows, error: deleteError } = await adminSupabase
      .from('posts')
      .delete()
      .eq('id', id)
      .select('id')
    
    if (deleteError) {
      console.error('🔍 ADMIN DELETE FAILED:', deleteError.message)
      return NextResponse.json({ 
        error: 'Execution failed on server. Maybe foreign key constraints are blocking deletion.', 
        details: deleteError.message 
      }, { status: 500 })
    }

    if (!deletedRows || deletedRows.length === 0) {
      console.log('🔍 DELETE ANOMALY:', { id, totalDeleted: 0 })
      return NextResponse.json({ error: 'The record exists but the delete operation returned 0 rows. Unexpected behavior.' }, { status: 500 })
    }

    console.log('✅ DELETE COMPLETED SUCCESSFULLY.', { id, totalDeleted: deletedRows.length })
    return NextResponse.json({ success: true, count: deletedRows.length })
  } catch (err) {
    console.error('🛑 GLOBAL DELETE ERROR:', err)
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 })
  }
}
