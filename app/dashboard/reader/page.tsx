import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/PostCard'
import { timeAgo } from '@/lib/utils'

export default async function ReaderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  // Recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)

  // My comments
  const { data: myComments } = await supabase
    .from('comments')
    .select('*, post:posts(title, slug)')
    .eq('user_id', user.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {profile?.name ?? 'Reader'}</h1>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Recent Posts</h2>
        <div className="grid grid-cols-3 gap-4">
          {(recentPosts || []).map((p: any) => (
            <PostCard key={p.id} post={p} />
          ))}
          {(!recentPosts || recentPosts.length === 0) && (
            <p className="text-sm text-gray-500">No recent posts</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">My Comments</h2>
        <div className="space-y-3">
          {(myComments || []).map((c: any) => (
            <div key={c.id} className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">On <Link href={`/blog/${c.post.slug}`} className="text-blue-600">{c.post.title}</Link></div>
              <div className="text-xs text-gray-500">{timeAgo(c.created_at)}</div>
              <p className="mt-2 text-sm text-gray-700">{c.comment_text}</p>
            </div>
          ))}

          {(!myComments || myComments.length === 0) && (
            <p className="text-sm text-gray-500">You haven't commented yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
