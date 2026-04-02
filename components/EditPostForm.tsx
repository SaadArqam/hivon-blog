"use client"

import React from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Post } from '@/types'

export default function EditPostForm({ initialPost }: { initialPost: Post }) {
  const supabase = createBrowserClient()
  const [title, setTitle] = React.useState(initialPost.title)
  const [body, setBody] = React.useState(initialPost.body)
  const [imageUrl, setImageUrl] = React.useState<string | null>(initialPost.image_url ?? null)
  const [file, setFile] = React.useState<File | null>(null)
  const [saving, setSaving] = React.useState(false)

  async function uploadImage(file: File) {
    const path = `post-images/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
    return urlData.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let finalImage = imageUrl
      if (file) {
        finalImage = await uploadImage(file)
      }

      const res = await fetch(`/api/posts/${initialPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, image_url: finalImage }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error ?? 'Update failed')
      }
      const { post: updatedPost } = await res.json()
      toast.success('Post updated')
      // navigate to post with potentially new slug
      window.location.href = `/blog/${updatedPost.slug}`
    } catch (err: any) {
      console.error(err)
      toast.error(err.message ?? 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-md p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mt-1 block w-full border rounded-md p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Body</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          className="mt-1 block w-full border rounded-md p-2 min-h-[200px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Featured Image</label>
        {imageUrl && (
          <div className="mt-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="featured" className="h-40 object-cover rounded" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
