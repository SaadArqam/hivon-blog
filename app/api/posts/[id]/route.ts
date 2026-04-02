import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { postUpdateSchema, validateRequest } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    const role = profile?.role
    const isOwner = post.author_id === user.id
    if (!(isOwner || role === 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates = validateRequest(postUpdateSchema, await request.json())

    // handle slug change if title changed
    if (updates.title && updates.title !== post.title) {
      let newSlug = slugify(updates.title)
      const { data: existing } = await supabase.from('posts').select('id').eq('slug', newSlug).maybeSingle()
      if (existing && existing.id !== post.id) {
        newSlug = `${newSlug}-${Date.now()}`
      }
      updates.slug = newSlug
    }
    
    updates.updated_at = new Date().toISOString()

    const { data: updated, error } = await supabase.from('posts').update(updates).eq('id', id).select().maybeSingle()
    if (error) {
      console.error('Post update error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
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
    console.log('🔍 Delete request for post ID:', id)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('🔍 Auth user:', user?.id, user?.email)
    
    if (!user) {
      console.log('🔍 No user authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
    console.log('🔍 Post found:', post?.title)
    
    if (!post) {
      console.log('🔍 Post not found')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    const role = profile?.role
    const isOwner = post.author_id === user.id
    console.log('🔍 Permission check:', { userId: user.id, postAuthorId: post.author_id, role, isOwner })
    
    if (!(isOwner || role === 'admin')) {
      console.log('🔍 Permission denied')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('posts').delete().eq('id', id)
    console.log('🔍 Delete result:', { error })
    
    if (error) {
      console.error('Delete post error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    console.log('🔍 Post deleted successfully')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/posts/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
