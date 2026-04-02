import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { timeAgo, readingTime } from '@/lib/utils'
import CommentSection from '@/components/CommentSection'
import DeletePostButton from '@/components/DeletePostButton'
import LikeButton from '@/components/LikeButton'
import ReadingProgress from '@/components/ReadingProgress'
import CopyLinkButton from '@/components/CopyLinkButton'
import { sanitizeHtml, escapeHtml } from '@/lib/sanitize'
import { canEditPost } from '@/lib/rbac'

interface Props {
  params: Promise<{ slug: string }>
}

function bodyToHtml(text: string) {
  const escaped = escapeHtml(text)
  const paragraphs = escaped
    .split(/\n{2,}/g)
    .map(p => `<p>${sanitizeHtml(p.replace(/\n/g, '<br/>'))}</p>`)
    .join('')
  return paragraphs
}

export default async function PostPage({ params }: Props) {
  const supabase = await createClient()
  const { slug } = await params

  // Fetch post by slug
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    return notFound()
  }

  // Fetch author
  const { data: author } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', post.author_id)
    .maybeSingle()

  // Get current user to decide edit permissions
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user profile for role checking
  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', user.id)
      .maybeSingle()
    userProfile = profile
  }

  const canEdit = canEditPost(userProfile, post.author_id)

  // Fetch likes for this post
  const { data: likesData } = await supabase
    .from('likes')
    .select('user_id')
    .eq('post_id', post.id)

  const likeCount = likesData?.length ?? 0
  const currentUserId = user?.id
  const userLiked = currentUserId ? (likesData as { user_id: string }[])?.some(l => l.user_id === currentUserId) ?? false : false

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ReadingProgress />
      <article className="bg-white rounded-lg shadow-sm overflow-hidden">
        {post.image_url && (
          <div className="relative h-72 w-full">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
              <div className="mt-2 text-sm text-gray-500">
                <span>{author?.name ?? 'Unknown'}</span>
                <span> · </span>
                <span>{timeAgo(post.created_at)}</span>
                <span> · </span>
                <span>{readingTime(post.body)}</span>
              </div>
              <div className="mt-3">
                <LikeButton postId={post.id} initialCount={likeCount} initialLiked={userLiked} />
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/blog/${post.slug}/edit`}
                  className="text-sm px-4 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
                <DeletePostButton postId={post.id} variant="small" />
                <CopyLinkButton />
              </div>
            )}
          </div>

          {post.summary && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-600 mb-1">✨ AI Summary</p>
              <p className="text-sm text-gray-700">{post.summary}</p>
            </div>
          )}

          <div className="mt-6 prose max-w-none text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: bodyToHtml(post.body) }} />
          </div>
        </div>
      </article>

      <div className="mt-8">
        <CommentSection postId={post.id} />
      </div>
    </div>
  )
}
