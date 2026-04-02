"use client"

import React, { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface Props {
  commentId: string
}

export default function HideCommentButton({ commentId }: Props) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleHide() {
    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
      })
      if (!res.ok) throw new Error('Failed to hide comment')
      
      toast.success('Comment has been hidden.')
      window.location.reload()
    } catch (err) {
      toast.error('Failed to update comment status.')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)} 
        disabled={loading}
        className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-red-500 transition-colors"
      >
        {loading ? '...' : 'Remove'}
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleHide}
        loading={loading}
        title="Hide Discussion Post?"
        description="This will remove the comment from public view. This action can be undone from the database if necessary, but it will be immediate."
        confirmText="Remove"
        variant="destructive"
      />
    </>
  )
}
