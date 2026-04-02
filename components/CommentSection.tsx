"use client"

import React, { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'

type CommentBase = {
  id: string
  post_id: string
  user_id: string
  comment_text: string
  is_hidden: boolean
  created_at: string
  user?: { name?: string }
}

type CommentWithReplies = CommentBase & {
  replies?: CommentBase[]
}

interface Props {
  postId: string
}

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [text, setText] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null)
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({})

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const authRes = await supabase.auth.getUser()
      const user = authRes.data?.user as { id?: string; email?: string } | null
      if (!user || !mounted || !user.id) return
      setUserId(user.id)
      const profileRes = await supabase
        .from('users')
        .select('name, role')
        .eq('id', user.id)
        .maybeSingle()
      const profile = profileRes.data as { name?: string; role?: string } | null
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
      const fetched = json.comments ?? []
      setComments(fetched)
      // default: collapse replies
      const map: Record<string, boolean> = {}
      fetched.forEach((c: CommentWithReplies) => { if (c.id) map[c.id] = true })
      setCollapsedMap(map)
    } catch (err) {
      console.error(err)
      toast.error('Could not load comments')
    } finally {
      setLoading(false)
    }
  }

  async function postComment(body: { comment_text: string; reply_to_id?: string | null }) {
    if (!userId) {
      toast.error('You must be logged in to comment')
      return null
    }

    const tempId = `temp-${Date.now()}`
    const tempComment: CommentWithReplies = {
      id: tempId,
      post_id: postId,
      user_id: userId,
      comment_text: body.comment_text,
      is_hidden: false,
      created_at: new Date().toISOString(),
      user: { name: userName ?? 'You' },
    }

    // Optimistic UI: if posting a reply, attach under parent; else prepend
    if (body.reply_to_id) {
      setComments(prev => prev.map(c => c.id === body.reply_to_id ? ({ ...c, replies: [...(c.replies || []), tempComment] }) : c))
    } else {
      setComments(prev => [tempComment, ...prev])
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ post_id: postId, comment_text: body.comment_text, reply_to_id: body.reply_to_id }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      const json = await res.json()

      // Replace temp comment(s)
      if (body.reply_to_id) {
        const serverReply = json.comment
        setComments(prev => prev.map(c => c.id === body.reply_to_id ? ({ ...c, replies: [...(c.replies || []).map(r => r.id === tempId ? serverReply : r), serverReply] }) : c))
      } else {
        const serverComment = json.comment
        setComments(prev => prev.map(c => c.id === tempId ? serverComment : c))
      }
      toast.success('Comment posted')
      return json.comment
    } catch (err) {
      console.error(err)
      // rollback optimistic add
      setComments(prev => prev.filter(c => c.id !== tempId).map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== tempId) })))
      toast.error('Failed to post comment')
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    await postComment({ comment_text: text.trim() })
    setText('')
  }

  async function handleReplySubmit(parentId: string, replyText: string) {
    if (!replyText.trim()) return
    await postComment({ comment_text: replyText.trim(), reply_to_id: parentId })
    setOpenReplyFor(null)
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
      // remove comment from UI
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== commentId) })))
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
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">{c.user?.name?.charAt(0) ?? '?'}</div>
                  <div>
                    <div className="text-sm font-medium">{c.user?.name ?? 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{timeAgo(c.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button onClick={() => handleHide(c.id)} className="text-xs text-red-600 hover:underline">Hide</button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{c.comment_text}</p>

              <div className="mt-2 flex items-center gap-3">
                {/* Reply toggle and button */}
                {c.replies && c.replies.length > 0 && (
                  <button
                    className="text-sm text-blue-600"
                    onClick={() => setCollapsedMap(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  >
                    {c.replies.length} repl{c.replies.length === 1 ? 'y' : 'ies'}
                  </button>
                )}

                {/* Reply button only on top-level comments */}
                <button
                  onClick={() => setOpenReplyFor(openReplyFor === c.id ? null : c.id)}
                  className="text-sm text-gray-600"
                >
                  Reply
                </button>
              </div>

              {/* Reply input */}
              {openReplyFor === c.id && (
                <div className="mt-3">
                  <ReplyBox
                    onCancel={() => setOpenReplyFor(null)}
                    onSubmit={async (val) => await handleReplySubmit(c.id, val)}
                  />
                </div>
              )}

              {/* Replies (indented) */}
              {c.replies && c.replies.length > 0 && (
                <div className="mt-3 border-l-2 border-blue-200 pl-4 ml-8 space-y-2">
                  {!collapsedMap[c.id] && (c as CommentWithReplies).replies?.map(r => (
                    <div key={r.id} className="bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">{r.user?.name?.charAt(0) ?? '?'}</div>
                          <div>
                            <div className="text-sm font-medium">{r.user?.name ?? 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{timeAgo(r.created_at)}</div>
                          </div>
                        </div>
                        <div>
                          {isAdmin && (
                            <button onClick={() => handleHide(r.id)} className="text-xs text-red-600 hover:underline">Hide</button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{r.comment_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReplyBox({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (val: string) => Promise<void> }) {
  const [val, setVal] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handlePost() {
    if (!val.trim()) return
    setSubmitting(true)
    await onSubmit(val)
    setVal('')
    setSubmitting(false)
  }

  return (
    <div className="space-y-2">
      <textarea value={val} onChange={e => setVal(e.target.value)} className="w-full border rounded-md p-2 min-h-[60px]"></textarea>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
        <button onClick={handlePost} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={submitting}>{submitting ? 'Posting...' : 'Post Reply'}</button>
      </div>
    </div>
  )
}
