'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/types'
import { timeAgo, readingTime } from '@/lib/utils'
import LikeButton from '@/components/LikeButton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import useUser from '@/hooks/useUser'
import { canDeletePost } from '@/lib/rbac'

interface PostCardProps {
  post: Post & { author?: { name: string } }
  onDelete?: () => void
  likeCount?: number
  liked?: boolean
}

export default function PostCard({ post, onDelete, likeCount, liked }: PostCardProps) {
  const { user } = useUser()
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    if (!confirm('Delete this post? This action cannot be undone.')) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete post')
        return
      }
      
      if (data.success || data.deleteData) {
        toast.success('Post deleted')
        onDelete?.()
      } else {
        toast.error('Post deletion may have failed')
      }
    } catch (err) {
      toast.error('Could not delete post')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden group hover:border-gray-300 transition-colors">
      {/* Featured Image */}
      {post.image_url && (
        <Link href={`/blog/${post.slug}`} className="block relative h-52 w-full overflow-hidden border-b border-gray-50">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </Link>
      )}

      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
          <span>{post.author?.name ?? 'Unknown'}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-xl font-bold text-gray-900 leading-snug group-hover:text-gray-600 transition-colors mb-3 line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* AI Summary */}
        {post.summary && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 mb-6">
             <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">AI INSIGHT</span>
             <p className="text-xs text-gray-600 leading-relaxed italic line-clamp-2">{post.summary}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-4">
             <Link
                href={`/blog/${post.slug}`}
                className="text-xs font-semibold text-gray-900 hover:opacity-70 transition-opacity"
            >
                Continue reading
            </Link>
          </div>
          
          <div className="flex items-center gap-4 scale-90 origin-right">
            <LikeButton
              postId={post.id}
              initialCount={typeof (post as any).likeCount === 'number' ? (post as any).likeCount! : (typeof likeCount === 'number' ? likeCount : 0)}
              initialLiked={!!liked}
            />

            {user && canDeletePost(user, post.author_id) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-[10px] h-7 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                    {deleting ? '...' : 'Remove'}
                </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}