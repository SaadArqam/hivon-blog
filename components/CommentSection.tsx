"use client"

import React, { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

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
  }, [])

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?post_id=${encodeURIComponent(postId)}`)
      if (!res.ok) throw new Error('Failed to load comments')
      const json = await res.json()
      const fetched = json.comments ?? []
      setComments(fetched)
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

      const serverComment = json.comment
      if (body.reply_to_id) {
        setComments(prev => prev.map(c => c.id === body.reply_to_id ? ({ ...c, replies: (c.replies || []).map(r => r.id === tempId ? serverComment : r) }) : c))
      } else {
        setComments(prev => prev.map(c => c.id === tempId ? serverComment : c))
      }
      toast.success('Comment posted')
      return json.comment
    } catch (err) {
      console.error(err)
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
    if (!isAdmin) return
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
      })
      if (!res.ok) throw new Error('Failed to hide')
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== commentId) })))
      toast.success('Comment hidden')
    } catch (err) {
      console.error(err)
      toast.error('Failed to hide comment')
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold tracking-tight text-gray-900">
            Discussion ({comments.length + (comments.reduce((acc, c) => acc + (c.replies?.length ?? 0), 0))})
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400"
          placeholder={userId ? 'Share your thoughts...' : 'You must be logged in to participate.'}
          disabled={!userId}
        />
        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            size="sm"
            className="rounded-full bg-gray-900 text-white hover:bg-black px-6 text-xs font-bold uppercase tracking-widest h-10"
            disabled={!userId || !text.trim()}
          >
            Post Comment
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="py-10 text-center">
            <span className="text-sm font-medium text-gray-400 animate-pulse">Loading discussion...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {comments.map(c => (
            <div key={c.id} className="group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase">{c.user?.name?.charAt(0) ?? '?'}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{c.user?.name ?? 'Unknown'}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{timeAgo(c.created_at)}</span>
                    </div>
                    {isAdmin && (
                        <button onClick={() => handleHide(c.id)} className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-red-500 transition-colors">
                            Remove
                        </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.comment_text}</p>
                  
                  <div className="flex items-center gap-4 pt-1">
                    <button
                        onClick={() => setOpenReplyFor(openReplyFor === c.id ? null : c.id)}
                        className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        Reply
                    </button>
                    {c.replies && c.replies.length > 0 && (
                        <button
                            onClick={() => setCollapsedMap(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                            className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            {collapsedMap[c.id] ? `Show ${c.replies.length} replies` : `Hide replies`}
                        </button>
                    )}
                  </div>

                  {openReplyFor === c.id && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <ReplyBox
                        onCancel={() => setOpenReplyFor(null)}
                        onSubmit={async (val) => await handleReplySubmit(c.id, val)}
                      />
                    </div>
                  )}

                  {!collapsedMap[c.id] && c.replies && c.replies.length > 0 && (
                    <div className="mt-6 space-y-6 pt-6 border-l border-gray-100 pl-6 ml-1">
                      {c.replies.map(r => (
                        <div key={r.id} className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{r.user?.name?.charAt(0) ?? '?'}</span>
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">{r.user?.name ?? 'Unknown'}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{timeAgo(r.created_at)}</span>
                                    </div>
                                    {isAdmin && (
                                        <button onClick={() => handleHide(r.id)} className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-red-500 transition-colors">
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{r.comment_text}</p>
                            </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="py-20 text-center border border-dashed border-gray-100 rounded-2xl">
                <p className="text-sm font-medium text-gray-400">No discussion started yet.</p>
            </div>
          )}
        </div>
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
    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
      <textarea 
        autoFocus
        value={val} 
        onChange={e => setVal(e.target.value)} 
        className="w-full bg-white border border-gray-200 rounded-lg p-3 min-h-[80px] text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400"
        placeholder="Write a reply..."
      />
      <div className="flex gap-2 justify-end">
        <button 
            onClick={onCancel} 
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
        >
            Cancel
        </button>
        <Button 
            onClick={handlePost} 
            size="sm"
            className="rounded-full bg-gray-900 text-white hover:bg-black px-4 text-[10px] font-bold uppercase tracking-widest h-8"
            disabled={submitting || !val.trim()}
        >
            {submitting ? '...' : 'Reply'}
        </Button>
      </div>
    </div>
  )
}
