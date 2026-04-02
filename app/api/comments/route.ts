import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { commentCreateSchema, commentHideSchema, validateRequest } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const post_id = searchParams.get('post_id')
    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
    }

    const supabase = await createClient()
    // Fetch top-level comments and their direct replies (one level deep)
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(name),
        replies:comments!reply_to_id(
          *,
          user:users(name)
        )
      `)
      .eq('post_id', post_id)
      .is('reply_to_id', null)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Comments fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({ comments: [] })
    }

    return NextResponse.json({ comments })

  } catch (err) {
    console.error('Comments GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, comment_text, reply_to_id } = validateRequest(commentCreateSchema, body)
    if (!post_id || !comment_text || String(comment_text).trim() === '') {
      return NextResponse.json({ error: 'post_id and comment_text are required' }, { status: 400 })
    }

    // If replying, validate the parent comment exists and belongs to same post
    if (reply_to_id) {
      const { data: parent } = await supabase
        .from('comments')
        .select('id, post_id')
        .eq('id', reply_to_id)
        .maybeSingle()
      if (!parent) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 })
      }
      if (parent.post_id !== post_id) {
        return NextResponse.json({ error: 'Parent comment does not belong to this post' }, { status: 400 })
      }
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({ post_id, user_id: user.id, comment_text, reply_to_id: reply_to_id || null, is_hidden: false })
      .select()
      .single()

    if (error || !comment) {
      console.error('Insert comment error:', error)
      return NextResponse.json({ error: 'Failed to insert comment' }, { status: 500 })
    }

    // Attach user name
    const { data: profile } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.json({ comment: { ...comment, user: profile ?? null } })

  } catch (err) {
    console.error('Comments POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only admin allowed to hide comments
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { comment_id } = validateRequest(commentHideSchema, await request.json())
    if (!comment_id) return NextResponse.json({ error: 'comment_id required' }, { status: 400 })

    const { error } = await supabase
      .from('comments')
      .update({ is_hidden: true })
      .eq('id', comment_id)

    if (error) {
      console.error('Hide comment error:', error)
      return NextResponse.json({ error: 'Failed to hide comment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Comments PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
