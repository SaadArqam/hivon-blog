import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const post_id = searchParams.get('post_id')
    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post_id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Comments fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({ comments: [] })
    }

    // Fetch users for comment authors
    const userIds = Array.from(new Set(comments.map((c: any) => c.user_id)))
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds)

    const usersMap = new Map<string, any>()
    users?.forEach(u => usersMap.set(u.id, u))

    const enriched = comments.map((c: any) => ({ ...c, user: usersMap.get(c.user_id) ?? null }))

    return NextResponse.json({ comments: enriched })

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
    const { post_id, comment_text } = body
    if (!post_id || !comment_text || String(comment_text).trim() === '') {
      return NextResponse.json({ error: 'post_id and comment_text are required' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({ post_id, user_id: user.id, comment_text, is_hidden: false })
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

    const { comment_id } = await request.json()
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
