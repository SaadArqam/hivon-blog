import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const post_id = searchParams.get('post_id')
    if (!post_id) return NextResponse.json({ error: 'post_id is required' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('likes')
      .select('user_id')
      .eq('post_id', post_id)

    if (error) {
      console.error('Likes fetch error:', error)
      const msg = String(error.message ?? error)
      // In dev, return the raw error to help debugging
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ error: 'Failed to fetch likes', details: msg }, { status: 500 })
      }
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
    }

    const count = data?.length ?? 0

    // Determine if current user liked the post
    const { data: userData } = await supabase.auth.getUser()
    const currentUserId = userData?.user?.id
    const liked = currentUserId ? (data as { user_id: string }[])?.some(l => l.user_id === currentUserId) ?? false : false

    return NextResponse.json({ count, liked })
  } catch (err) {
    console.error('Likes GET error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { post_id } = await request.json()
    if (!post_id) return NextResponse.json({ error: 'post_id is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('likes')
      .insert({ post_id, user_id: user.id })

    if (error) {
      console.error('Like insert error:', error)
      const msg = String(error.message ?? error)
      // Detect unique constraint / already liked
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return NextResponse.json({ error: 'Already liked' }, { status: 409 })
      }
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ error: 'Failed to like', details: msg }, { status: 500 })
      }
      return NextResponse.json({ error: 'Failed to like' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Likes POST error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { post_id } = await request.json()
    if (!post_id) return NextResponse.json({ error: 'post_id is required' }, { status: 400 })

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Unlike error:', error)
      const msg = String(error.message ?? error)
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ error: 'Failed to unlike', details: msg }, { status: 500 })
      }
      return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Likes DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
