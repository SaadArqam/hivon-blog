import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import DeletePostButton from '@/components/DeletePostButton'
import HideCommentButton from '@/components/HideCommentButton'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') return redirect('/')

  const { data: posts } = await supabase.from('posts').select('id, slug, title, author_id, status, created_at')
  const { data: comments } = await supabase.from('comments').select('id, post_id, user_id, comment_text, is_hidden, created_at')
  const { data: users } = await supabase.from('users').select('id, name, email, role')

  const postsCount = posts?.length ?? 0
  const commentsCount = comments?.length ?? 0
  const usersCount = users?.length ?? 0

  const usersMap = new Map<string, any>()
  users?.forEach(u => usersMap.set(u.id, u))

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500">Posts</div>
          <div className="text-2xl font-semibold">{postsCount}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500">Comments</div>
          <div className="text-2xl font-semibold">{commentsCount}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500">Users</div>
          <div className="text-2xl font-semibold">{usersCount}</div>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-3">Posts</h2>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Author</th>
                <th className="p-2">Status</th>
                <th className="p-2">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts?.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.title}</td>
                  <td className="p-2">{usersMap.get(p.author_id)?.name ?? 'Unknown'}</td>
                  <td className="p-2 text-center">{p.status}</td>
                  <td className="p-2">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/blog/${p.slug}/edit`} className="text-blue-600">Edit</Link>
                      <DeletePostButton postId={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-3">Comments</h2>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Comment</th>
                <th className="p-2">Author</th>
                <th className="p-2">Post</th>
                <th className="p-2">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments?.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.comment_text}</td>
                  <td className="p-2">{usersMap.get(c.user_id)?.name ?? 'Unknown'}</td>
                  <td className="p-2">{c.post_id}</td>
                  <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <HideCommentButton commentId={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Users</h2>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

