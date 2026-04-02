"use client"

import React, { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Comment } from '@/types'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  postId: string
}

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [text, setText] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  useEffect(() => {
    // get current user and role
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user || !mounted) return
      setUserId(user.id)
      // fetch profile for name and role
      const { data: profile } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', user.id)
        .maybeSingle()
      setUserName(profile?.name ?? user.email ?? 'You')
      setIsAdmin(profile?.role === 'admin')
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?post_id=${encodeURIComponent(postId)}`)
      if (!res.ok) throw new Error('Failed to load comments')
      const json = await res.json()
      setComments(json.comments ?? [])
    } catch (err) {
      console.error(err)
      toast.error('Could not load comments')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    if (!userId) {
      toast.error('You must be logged in to comment')
      return
    }

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      user_id: userId,
      comment_text: text.trim(),
      is_hidden: false,
      created_at: new Date().toISOString(),
      user: { id: userId, name: userName ?? 'You', email: '', role: 'viewer', created_at: new Date().toISOString() },
    }

    // optimistic UI
    setComments(prev => [tempComment, ...prev])
    setText('')

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, comment_text: tempComment.comment_text }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      const json = await res.json()
      // replace temp comment with server comment
      setComments(prev => prev.map(c => (c.id === tempComment.id ? json.comment : c)))
      toast.success('Comment posted')
    } catch (err) {
      console.error(err)
      // rollback optimistic add
      setComments(prev => prev.filter(c => c.id !== tempComment.id))
      toast.error('Failed to post comment')
    }
  }

  async function handleHide(commentId: string) {
    if (!isAdmin) {
      toast.error('Unauthorized')
      return
    }
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
      })
      if (!res.ok) throw new Error('Failed to hide')
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment hidden')
    } catch (err) {
      console.error(err)
      toast.error('Failed to hide comment')
    }
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-3">Comments</h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full border rounded-md p-2 min-h-[80px]"
          placeholder={userId ? 'Write a comment...' : 'Log in to leave a comment'}
          disabled={!userId}
        />
        <div className="flex items-center justify-end mt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            disabled={!userId || !text.trim()}
          >
            Post Comment
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map(c => (
            <li key={c.id} className="border rounded-md p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">{c.user?.name ?? 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{timeAgo(c.created_at)}</div>
                </div>
                {isAdmin && (
                  <div>
                    <button
                      onClick={() => handleHide(c.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Hide
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{c.comment_text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
