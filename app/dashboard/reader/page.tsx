import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/PostCard'
import { Post, Comment } from '@/types'
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
    .select('*, author:users(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3)
  const recentPostsTyped = (recentPosts ?? []) as (Post & { author?: { name: string } })[]

  // My comments
  const { data: myComments } = await supabase
    .from('comments')
    .select('*, post:posts(title, slug)')
    .eq('user_id', user.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(10)
  type CommentWithPost = Comment & { post: { title: string; slug: string } }
  const myCommentsTyped = (myComments ?? []) as CommentWithPost[]

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 space-y-24">
      <header className="space-y-4 border-b border-gray-100 pb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">Welcome back, {profile?.name ?? 'Reader'}.</h1>
        <p className="text-gray-500 text-lg">See the latest stories and your activity.</p>
      </header>

      <section className="space-y-12">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Recommended for you</h2>
            <Link href="/" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">See all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentPostsTyped.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {(!recentPosts || recentPosts.length === 0) && (
            <p className="text-sm text-gray-400 italic">No new stories available yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Your Activity</h2>
        </div>
        <div className="space-y-4">
          {myCommentsTyped.map((c) => (
            <div key={c.id} className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Commented {timeAgo(c.created_at)}</span>
                    <span className="h-1 w-1 bg-gray-200 rounded-full" />
                    <Link href={`/blog/${c.post.slug}`} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors">{c.post.title}</Link>
                </div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed italic border-l-2 border-gray-100 pl-6">&ldquo;{c.comment_text}&rdquo;</p>
              </div>
            </div>
          ))}

          {(!myCommentsTyped || myCommentsTyped.length === 0) && (
            <div className="py-24 text-center border border-dashed border-gray-100 rounded-2xl">
                <p className="text-sm text-gray-400">You haven&apos;t joined any discussions yet.</p>
                <Link href="/" className="text-xs font-bold uppercase tracking-widest text-gray-900 hover:opacity-60 transition-opacity mt-4 block">Browse Stories</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
