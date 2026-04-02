'use client'

import { useState, useEffect } from 'react'
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
  const [loading, setLoading] = useState(false)

  // Fetch true state on mount if user might be logged in
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/likes?post_id=${postId}`)
        if (res.ok) {
          const data = await res.json()
          setCount(data.count)
          setLiked(data.liked)
        }
      } catch (err) {
        console.error('Failed to fetch like status:', err)
      }
    }

    // Only fetch if it's the home page (where we don't pass reliable initial states)
    // or if we want to be 100% sure. 
    // Given the user report, we'll fetch to ensure consistency.
    fetchStatus()
  }, [postId])

  async function toggle() {
    if (loading) return
    setLoading(true)

    const wasLiked = liked
    const previousCount = count

    // Optimistic UI update
    setLiked(!wasLiked)
    setCount(prev => (wasLiked ? prev - 1 : prev + 1))

    try {
      const res = await fetch('/api/likes', {
        method: wasLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })

      if (!res.ok) {
        const data = await res.json()
        
        // If already liked (409), then just sync the state to liked instead of rolling back
        if (res.status === 409) {
          setLiked(true)
          // Don't rollback count if it was already liked
          return
        }

        if (res.status === 401) {
            toast.error('Log in to like stories')
        } else {
            toast.error(data.error || 'Something went wrong')
        }
        
        // Rollback
        setLiked(wasLiked)
        setCount(previousCount)
      }
    } catch {
      toast.error('Network error')
      setLiked(wasLiked)
      setCount(previousCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle()
      }}
      className="group inline-flex items-center gap-1.5 transition-all outline-none"
      aria-pressed={liked}
    >
      <div className={`p-2 rounded-full transition-all duration-300 ${
        liked 
            ? 'bg-gray-900 text-white shadow-sm' 
            : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-900'
      }`}>
        <Heart 
            size={14} 
            className={`transition-all duration-300 ${liked ? 'fill-current scale-110' : 'scale-90 group-hover:scale-100'}`} 
        />
      </div>
      <span className={`text-xs font-bold font-sans tabular-nums transition-colors ${
        liked ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'
      }`}>
        {count}
      </span>
    </button>
  )
}
