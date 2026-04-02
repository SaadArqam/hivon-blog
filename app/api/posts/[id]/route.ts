import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

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

    const body = await request.json()
    const updates: any = {}
    if (typeof body.title === 'string' && body.title.trim() !== '') updates.title = body.title.trim()
    if (typeof body.body === 'string') updates.body = body.body
    if (typeof body.image_url === 'string') updates.image_url = body.image_url
    if (typeof body.status === 'string') updates.status = body.status

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

    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) {
      console.error('Delete post error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/posts/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
