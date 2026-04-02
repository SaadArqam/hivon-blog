'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface LikeButtonProps {
  postId: string
  initialCount?: number
  initialLiked?: boolean
}

export default function LikeButton({ postId, initialCount = 0, initialLiked = false }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [anim, setAnim] = useState(false)


  async function toggle() {
    try {
      const loggedInRes = await fetch('/api/likes?post_id=' + postId)
      if (loggedInRes.status === 401) {
        toast('Please login to like posts')
        return
      }
    } catch {}

    // Optimistic UI
    setLiked(prev => !prev)
    setCount(c => (liked ? c - 1 : c + 1))
    setAnim(true)
    setTimeout(() => setAnim(false), 200)

    try {
      const res = await fetch('/api/likes', {
        method: liked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })

      if (!res.ok) {
        // rollback optimistic
        setLiked(prev => !prev)
        setCount(c => (liked ? c + 1 : c - 1))
        const data = await res.json()
        toast.error(data.error || 'Failed to update like')
      }
    } catch {
      // rollback
      setLiked(prev => !prev)
      setCount(c => (liked ? c + 1 : c - 1))
      toast.error('Something went wrong')
    }
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors ${anim ? 'scale-105' : ''}`}
      aria-pressed={liked}
    >
      <Heart size={16} className={liked ? 'text-red-600 fill-red-600' : 'text-gray-600'} />
      <span className="text-sm text-gray-700">{count}</span>
    </button>
  )
}
