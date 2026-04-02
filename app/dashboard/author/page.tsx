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

  // Supabase JS doesn't preserve generic types at runtime; assert the returned rows to Post[] safely
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Posts</h1>
        <Link href="/blog/new" className="px-4 py-2 bg-blue-600 text-white rounded">+ New Post</Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total posts</div>
          <div className="text-xl font-bold">{total}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Published</div>
          <div className="text-xl font-bold">{published}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Drafts</div>
          <div className="text-xl font-bold">{drafts}</div>
        </div>
      </div>

      <div className="space-y-4">
  {postsTyped.map((post: Post) => (
          <div key={post.id} className="bg-white p-4 rounded shadow">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/blog/${post.slug}`} className="text-lg font-semibold text-blue-600">{post.title}</Link>
                <div className="text-xs text-gray-500">{timeAgo(post.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{post.status}</span>
                <div className="text-sm text-gray-600">{commentsCountMap[post.id] ?? 0} comments</div>
                <div className="text-sm text-gray-600">{likesCountMap[post.id] ?? 0} likes</div>
                <Link href={`/blog/${post.slug}/edit`} className="px-3 py-1 border rounded">Edit</Link>
                <DeletePostButton postId={post.id} variant="small" />
              </div>
            </div>
          </div>
        ))}

        {(!posts || posts.length === 0) && (
          <div className="p-8 text-center bg-white rounded shadow">
            <h3 className="text-lg font-semibold">You haven&apos;t written any posts yet</h3>
            <p className="text-sm text-gray-500 mb-4">Start sharing your ideas with the world.</p>
            <Link href="/blog/new" className="px-4 py-2 bg-blue-600 text-white rounded">Write your first post</Link>
          </div>
        )}
      </div>
    </div>
  )
}
