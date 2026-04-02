"use client"

import React from 'react'
import { toast } from 'sonner'

interface Props {
  postId: string
}

export default function DeletePostButton({ postId }: Props) {
  const [loading, setLoading] = React.useState(false)

  async function handleDelete() {
    if (!confirm('Delete this post? This action cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Post deleted')
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error('Could not delete post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} className="text-red-600" disabled={loading}>
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
