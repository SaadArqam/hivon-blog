"use client"

import React from 'react'
import { toast } from 'sonner'

interface Props {
  commentId: string
}

export default function HideCommentButton({ commentId }: Props) {
  const [loading, setLoading] = React.useState(false)

  async function handleHide() {
    if (!confirm('Hide this comment?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Comment hidden')
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error('Could not hide comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleHide} className="text-red-600" disabled={loading}>
      {loading ? 'Hiding…' : 'Hide'}
    </button>
  )
}
