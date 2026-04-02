import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeletePostButton from '@/components/DeletePostButton'
import { timeAgo } from '@/lib/utils'
import { Post } from '@/types'

export default async function AuthorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'author' && profile.role !== 'admin')) {
    return redirect('/')
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const postsTyped = (posts ?? []) as Post[]
  const postIds = postsTyped.map(p => p.id)

  const { data: comments } = postIds.length
    ? await supabase.from('comments').select('post_id').in('post_id', postIds)
    : { data: [] }

  const { data: likes } = postIds.length
    ? await supabase.from('likes').select('post_id').in('post_id', postIds)
    : { data: [] }

  const commentsCountMap: Record<string, number> = {}
  const commentsData = (comments || []) as Array<{ post_id: string }>
  commentsData.forEach((c) => { commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1 })

  const likesCountMap: Record<string, number> = {}
  const likesData = (likes || []) as Array<{ post_id: string }>
  likesData.forEach((l) => { likesCountMap[l.post_id] = (likesCountMap[l.post_id] || 0) + 1 })

  const total = postsTyped.length
  const published = postsTyped.filter(p => p.status === 'published').length
  const drafts = postsTyped.filter(p => p.status === 'draft').length

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
    return status === 'published' 
      ? `${baseClasses} border-gray-100 bg-gray-50 text-gray-500`
      : `${baseClasses} border-yellow-100 bg-yellow-50 text-yellow-600`
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 space-y-16">
      <header className="flex items-center justify-between border-b border-gray-100 pb-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">My Stories.</h1>
          <p className="text-gray-500 text-lg">Manage your publications and drafts.</p>
        </div>
        <Link href="/blog/new" className="h-12 px-8 flex items-center bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm">
          New Story
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</div>
          <div className="text-4xl font-bold tracking-tight text-gray-900">{total}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Published</div>
          <div className="text-4xl font-bold tracking-tight text-gray-900 text-gray-900">{published}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Drafts</div>
          <div className="text-4xl font-bold tracking-tight text-gray-500">{drafts}</div>
        </div>
      </div>

      <div className="space-y-8">
        {postsTyped.map((post: Post) => (
          <div key={post.id} className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className={getStatusBadge(post.status)}>{post.status}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{timeAgo(post.created_at)}</span>
                </div>
                <Link href={`/blog/${post.slug}`} className="text-xl font-bold text-gray-900 hover:opacity-60 transition-opacity block">
                    {post.title}
                </Link>
                <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>{commentsCountMap[post.id] ?? 0} Comments</span>
                    <span>{likesCountMap[post.id] ?? 0} Likes</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 border-t md:border-t-0 pt-6 md:pt-0">
                <Link href={`/blog/${post.slug}/edit`} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                    Edit Story
                </Link>
                <div className="h-4 w-px bg-gray-100" />
                <DeletePostButton postId={post.id} variant="small" />
              </div>
            </div>
          </div>
        ))}

        {(!posts || posts.length === 0) && (
          <div className="py-24 text-center border border-dashed border-gray-100 rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">You haven&apos;t written any stories yet.</h3>
            <p className="text-gray-400 text-sm mb-10">Start sharing your ideas with the world.</p>
            <Link href="/blog/new" className="inline-block px-10 h-12 flex items-center justify-center bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">
                Write your first story
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
