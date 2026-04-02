'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface DeletePostButtonProps {
  postId: string
  variant?: 'default' | 'small'
}

export default function DeletePostButton({ postId, variant = 'default' }: DeletePostButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/posts/' + postId, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete post')
        return
      }

      toast.success('Story deleted successfully.')
      router.push('/')
      router.refresh()
    } catch (err) {
      toast.error('Something went wrong during deletion.')
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size={variant === 'small' ? 'sm' : 'default'}
        disabled={deleting}
        onClick={() => setShowConfirm(true)}
        className="text-[10px] font-bold uppercase tracking-widest px-4 h-8 rounded-full"
      >
        {deleting ? '...' : (variant === 'small' ? 'Remove' : 'Delete Story')}
      </Button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Permanently Delete Story?"
        description="Are you sure you want to delete this story? This action cannot be reversed."
        confirmText="Confirm Delete"
        variant="destructive"
      />
    </>
  )
}
