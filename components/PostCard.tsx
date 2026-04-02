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
  onDelete?: () => void // Optional callback for parent to refresh
  likeCount?: number
  liked?: boolean
}

export default function PostCard({ post, onDelete, likeCount, liked }: PostCardProps) {
  const { user } = useUser()
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    if (!confirm('Delete this post? This action cannot be undone.')) return
    
    console.log('🔍 DELETE FLOW - Frontend sending post.id:', post.id)
    console.log('🔍 DELETE FLOW - Full post object:', post)
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      const data = await res.json()
      
      console.log('🔍 DELETE FLOW - API Response:', { status: res.status, data })
      
      if (!res.ok) {
        console.error('Delete failed:', data)
        toast.error(data.error || 'Failed to delete post')
        return
      }
      
      // Only show success if API confirms deletion
      if (data.success || data.deleteData) {
        toast.success('Post deleted')
        onDelete?.() // Call parent callback to refresh
      } else {
        console.error('Delete API returned no success confirmation:', data)
        toast.error('Post deletion may have failed')
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Could not delete post')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <div className="bg-white rounded-xl border hover:shadow-md transition-shadow overflow-hidden">
      {/* Featured Image */}
      {post.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="eager"
            priority
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{post.author?.name ?? 'Unknown'}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
          <span>·</span>
          <span>{readingTime(post.body)}</span>
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* AI Summary */}
        {post.summary && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-600 mb-1">✨ AI Summary</p>
            <p className="text-sm text-gray-600 line-clamp-3">{post.summary}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/blog/${post.slug}`}
            className="inline-block text-sm text-blue-600 hover:underline font-medium"
          >
            Read more →
          </Link>
          
          {/* Delete Button for Admin */}
          {user && canDeletePost(user, post.author_id) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          {/* Like button */}
          <div>
            
            <LikeButton
              postId={post.id}
              initialCount={typeof (post as unknown as { likeCount?: number }).likeCount === 'number' ? (post as unknown as { likeCount?: number }).likeCount! : (typeof likeCount === 'number' ? likeCount : 0)}
              initialLiked={!!liked}
            />
          </div>
        </div>
      </div>
    </div>
  )
}