 'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface DeletePostButtonProps {
  postId: string
  variant?: 'default' | 'small'
}

export default function DeletePostButton({ postId, variant = 'default' }: DeletePostButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this post? This action cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/posts/' + postId, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete post')
        setDeleting(false)
        return
      }

      toast.success('Post deleted successfully')
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size={variant === 'small' ? 'sm' : 'default'}
      disabled={deleting}
      onClick={handleDelete}
    >
      {deleting ? 'Deleting...' : 'Delete Post'}
    </Button>
  )
}
