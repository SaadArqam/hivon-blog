import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import { Post, User, Comment } from '@/types'
import DeletePostButton from '@/components/DeletePostButton'
import HideCommentButton from '@/components/HideCommentButton'
import { canViewAdminDashboard } from '@/lib/rbac'

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

  const postsTyped = (posts ?? []) as Post[]
  const commentsTyped = (comments ?? []) as Comment[]
  const usersTyped = (users ?? []) as User[]

  const postsCount = postsTyped.length
  const commentsCount = commentsTyped.length
  const usersCount = usersTyped.length

  const usersMap = new Map<string, User>()
  usersTyped.forEach(u => usersMap.set(u.id, u))

  const postsMap = new Map<string, Post>()
  postsTyped.forEach(p => postsMap.set(p.id, p))

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
    return status === 'published' 
      ? `${baseClasses} border-gray-100 bg-gray-50 text-gray-500`
      : `${baseClasses} border-yellow-100 bg-yellow-50 text-yellow-600`
  }

  const truncateText = (text: string, maxLength: number) => 
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 space-y-24">
      <header className="space-y-4 border-b border-gray-100 pb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">Admin Control.</h1>
        <p className="text-gray-500 text-lg">Global perspective of the Hivon ecosystem.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Stories</div>
          <div className="text-4xl font-bold tracking-tight text-gray-900">{postsCount}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Discussion Items</div>
          <div className="text-4xl font-bold tracking-tight text-gray-900">{commentsCount}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Platform Users</div>
          <div className="text-4xl font-bold tracking-tight text-gray-900">{usersCount}</div>
        </div>
      </div>

      <section className="space-y-12">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Manage Stories</h2>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">Title</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">Author</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 text-center">Status</th>
                <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts?.map(p => (
                <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-2 font-bold text-gray-900">{p.title}</td>
                  <td className="py-4 px-2 text-gray-500 font-medium">{usersMap.get(p.author_id)?.name ?? 'Unknown'}</td>
                  <td className="py-4 px-2 text-center">
                    <span className={getStatusBadge(p.status)}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end gap-6">
                      <Link 
                        href={`/blog/${p.slug}/edit`} 
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors"
                      >
                        Edit
                      </Link>
                      <DeletePostButton postId={p.id} variant="small" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Registered Users</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {usersTyped.map(u => (
                <div key={u.id} className="flex items-center justify-between p-6 border border-gray-100 rounded-2xl hover:border-gray-300 transition-all bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{u.name.charAt(0)}</span>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900 leading-none mb-1">{u.name}</div>
                            <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{u.email}</div>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-gray-100 bg-gray-50 text-gray-400">
                        {u.role}
                    </span>
                </div>
            ))}
        </div>
      </section>

      <section className="space-y-12 pb-24">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Recent Discussion</h2>
        </div>
        <div className="space-y-4">
            {commentsTyped.slice(0, 10).map(c => {
                const post = postsMap.get(c.post_id)
                return (
                    <div key={c.id} className="p-6 border border-gray-100 rounded-2xl bg-white flex items-start justify-between gap-6 group hover:border-gray-300 transition-all">
                        <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">{usersMap.get(c.user_id)?.name}</span>
                                <span className="h-1 w-1 bg-gray-200 rounded-full" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">On {post?.title ?? 'Unknown'}</span>
                             </div>
                             <p className="text-sm text-gray-500 italic leading-relaxed">&ldquo;{truncateText(c.comment_text, 120)}&rdquo;</p>
                        </div>
                        <HideCommentButton commentId={c.id} />
                    </div>
                )
            })}
        </div>
      </section>
    </div>
  )
}
