import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import DeletePostButton from '@/components/DeletePostButton'
import HideCommentButton from '@/components/HideCommentButton'
import { canViewAdminDashboard, getRoleBadgeClasses, getRoleDisplayName } from '@/lib/rbac'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
  if (!canViewAdminDashboard(profile)) return redirect('/')

  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, title, author_id, status, created_at')
  const { data: comments } = await supabase
    .from('comments')
    .select('id, post_id, user_id, comment_text, is_hidden, created_at')
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')

  const postsCount = posts?.length ?? 0
  const commentsCount = comments?.length ?? 0
  const usersCount = users?.length ?? 0

  const usersMap = new Map<string, any>()
  users?.forEach(u => usersMap.set(u.id, u))

  const postsMap = new Map<string, any>()
  posts?.forEach(p => postsMap.set(p.id, p))

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full"
    return status === 'published' 
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-yellow-100 text-yellow-800`
  }

  const truncateText = (text: string, maxLength: number) => 
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text

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
        <h2 className="text-lg font-medium mb-3">All Posts ({postsCount})</h2>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Author Name</th>
                <th className="p-2">Status Badge</th>
                <th className="p-2">Created Date</th>
                <th className="p-2">Edit Button</th>
              </tr>
            </thead>
            <tbody>
              {posts?.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.title}</td>
                  <td className="p-2">{usersMap.get(p.author_id)?.name ?? 'Unknown'}</td>
                  <td className="p-2 text-center">
                    <span className={getStatusBadge(p.status)}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/blog/${p.slug}/edit`} 
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Edit
                      </Link>
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
        <h2 className="text-lg font-medium mb-3">All Comments ({commentsCount})</h2>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Comment Text (truncated to 60 chars)</th>
                <th className="p-2">Author Name</th>
                <th className="p-2">Post Title</th>
                <th className="p-2">Date</th>
                <th className="p-2">Hide Button</th>
              </tr>
            </thead>
            <tbody>
              {comments?.map(c => {
                const post = postsMap.get(c.post_id)
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{truncateText(c.comment_text, 60)}</td>
                    <td className="p-2">{usersMap.get(c.user_id)?.name ?? 'Unknown'}</td>
                    <td className="p-2">{post?.title ?? 'Unknown Post'}</td>
                    <td className="p-2">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-2">
                      <HideCommentButton commentId={c.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">All Users ({usersCount})</h2>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role Badge</th>
                <th className="p-2">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => {
                return (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <span className={getRoleBadgeClasses(u.role)}>
                        {getRoleDisplayName(u.role)}
                      </span>
                    </td>
                    <td className="p-2">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

