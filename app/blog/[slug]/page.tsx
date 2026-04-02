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
    .map(p => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      return `<p class="mb-4 leading-relaxed">${sanitizeHtml(trimmed.replace(/\n/g, '<br/>'))}</p>`
    })
    .join('')
  return paragraphs
}

export default async function PostPage({ params }: Props) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    return notFound()
  }

  const { data: author } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', post.author_id)
    .maybeSingle()

  const { data: { user } } = await supabase.auth.getUser()
  
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

  const { data: likesData } = await supabase
    .from('likes')
    .select('user_id')
    .eq('post_id', post.id)

  const likeCount = likesData?.length ?? 0
  const currentUserId = user?.id
  const userLiked = currentUserId ? (likesData as { user_id: string }[])?.some(l => l.user_id === currentUserId) ?? false : false

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <ReadingProgress />
      <article className="overflow-hidden">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{author?.name ?? 'Unknown'}</span>
                <span>·</span>
                <span>{timeAgo(post.created_at)}</span>
                <span>·</span>
                <span>{readingTime(post.body)}</span>
              </div>
              
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/blog/${post.slug}/edit`}
                    className="text-xs px-3 py-1 border rounded hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </Link>
                  <DeletePostButton postId={post.id} variant="small" />
                  <CopyLinkButton />
                </div>
              )}
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex items-center gap-4">
            <LikeButton postId={post.id} initialCount={likeCount} initialLiked={userLiked} />
          </div>
        </header>

        {post.image_url && (
          <div className="relative h-[400px] w-full mb-10 rounded-lg overflow-hidden border border-gray-100">
            <Image 
              src={post.image_url} 
              alt={post.title} 
              fill 
              className="object-cover" 
              priority
            />
          </div>
        )}

        {post.summary && (
          <div className="mb-10 bg-gray-50 border border-gray-200 rounded-lg px-6 py-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">
               AI Insight
            </h3>
            <p className="text-gray-600 leading-relaxed italic">
              {post.summary}
            </p>
          </div>
        )}

        <div className="prose prose-gray max-w-none prose-lg text-gray-800">
          <div dangerouslySetInnerHTML={{ __html: bodyToHtml(post.body) }} />
        </div>
      </article>

      <footer className="mt-16 pt-10 border-t border-gray-100">
        <CommentSection postId={post.id} />
      </footer>
    </div>
  )
}
