import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import React from 'react'
import type { Post } from '@/types'
import EditPostForm from '@/components/EditPostForm'

interface Props {
  params: { slug: string }
}

export default async function EditPostPage({ params }: Props) {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !post) return notFound()

  // Check auth and permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/(auth)/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role
  const isOwner = post.author_id === user.id
  if (!(isOwner || role === 'admin')) {
    return redirect('/')
  }

  // Render client-side form with initial data
  const serialized = JSON.parse(JSON.stringify(post)) as Post

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Edit Post</h1>
      <EditPostForm initialPost={serialized} />
    </div>
  )
}

// EditPostForm is implemented as a client component at components/EditPostForm.tsx
