import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/types'
import { timeAgo, readingTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface PostCardProps {
  post: Post & { author?: { name: string } }
}

export default function PostCard({ post }: PostCardProps) {
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

        {/* Read More */}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-block text-sm text-blue-600 hover:underline font-medium"
        >
          Read more →
        </Link>
      </div>
    </div>
  )
}