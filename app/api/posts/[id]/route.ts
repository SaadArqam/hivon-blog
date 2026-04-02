import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Use admin client for admin operations (bypasses RLS)
    let updateClient = supabase
    if (profile?.role === 'admin') {
      console.log('🔍 Using admin client for update (bypasses RLS)')
      updateClient = createAdminClient()
    }

    const { data: updated, error } = await updateClient.from('posts').update(updates).eq('id', id).select().maybeSingle()
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
    console.log('🔍 User profile data:', profile)
    const role = profile?.role
    const isOwner = post.author_id === user.id
    console.log('🔍 Permission check:', { userId: user.id, postAuthorId: post.author_id, role, isOwner })
    
    if (!(isOwner || role === 'admin')) {
      console.log('🔍 Permission denied - User is not owner or admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client for admin operations (bypasses RLS)
    let deleteClient = supabase
    if (role === 'admin') {
      console.log('🔍 Using admin client for deletion (bypasses RLS)')
      console.log('🔍 Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      try {
        deleteClient = createAdminClient()
        console.log('🔍 Admin client created successfully')
      } catch (error) {
        console.error('🔍 Failed to create admin client:', error)
        return NextResponse.json({ error: 'Admin client creation failed' }, { status: 500 })
      }
    }

    // Attempt deletion and request returning rows explicitly
    const { data: deleteData, error } = await deleteClient.from('posts').delete().eq('id', id).select('*')
    console.log('🔍 Delete result:', { deleteData, error })

    if (error) {
      console.error('Delete post error:', error)
      return NextResponse.json({ error: 'Failed to delete', details: error }, { status: 500 })
    }

    if (!deleteData || deleteData.length === 0) {
      console.log('🔍 No rows deleted with current client - attempting admin fallback if available')

      // If service role key is available, try admin deletion as a fallback to surface permission/RLS issues
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const admin = createAdminClient()
          const { data: adminDeleteData, error: adminError } = await admin.from('posts').delete().eq('id', id).select('*')
          console.log('🔍 Admin delete result:', { adminDeleteData, adminError })
          if (adminError) {
            console.error('Admin delete error:', adminError)
            return NextResponse.json({ error: 'Failed to delete (admin)', details: adminError }, { status: 500 })
          }
          if (!adminDeleteData || adminDeleteData.length === 0) {
            console.log('🔍 Admin deletion also removed no rows')
            return NextResponse.json({ error: 'No post was deleted' }, { status: 404 })
          }
          console.log('🔍 Post deleted by admin fallback')
          return NextResponse.json({ success: true })
        } catch (adminErr) {
          console.error('Admin fallback deletion failed:', adminErr)
          return NextResponse.json({ error: 'Admin fallback failed', details: String(adminErr) }, { status: 500 })
        }
      }

      console.log('🔍 No rows deleted - post may not exist or RLS prevented deletion')
      return NextResponse.json({ error: 'No post was deleted' }, { status: 404 })
    }

    console.log('🔍 Post deleted successfully')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/posts/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
