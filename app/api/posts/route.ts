import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'
import { generateSummary } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['author', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, body, image_url, status } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Generate slug
    let slug = slugify(title)

    // Check slug uniqueness, append number if needed
    const { data: existing } = await supabase
      .from('posts')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existing) {
      slug = slug + '-' + Date.now()
    }

    // Generate AI summary (only once on creation)
    const summary = await generateSummary(body)

    // Insert post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        slug,
        body,
        image_url: image_url || null,
        summary,
        author_id: user.id,
        status: status || 'published',
      })
      .select()
      .single()

    if (error) {
      console.error('Post insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post, slug })

  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}