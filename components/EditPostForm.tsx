"use client"

import React, { useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Post } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function EditPostForm({ initialPost }: { initialPost: Post }) {
  const supabase = createBrowserClient()
  const [title, setTitle] = useState(initialPost.title)
  const [body, setBody] = useState(initialPost.body)
  const [imageUrl, setImageUrl] = useState<string | null>(initialPost.image_url ?? null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function uploadImage(file: File) {
    setUploading(true)
    const path = `post-images/${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('post-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    
    if (error) {
      setUploading(false)
      throw error
    }
    
    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
    setUploading(false)
    return urlData.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!body.trim() || body.length < 50) {
      toast.error('Content must be at least 50 characters')
      return
    }

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
      toast.success('Story updated successfully.')
      // Redirect to the potentially new slug
      window.location.href = `/blog/${updatedPost.slug}`
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to update story.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white min-h-screen py-24 px-6">
      <main className="max-w-2xl mx-auto space-y-16">
        <header className="space-y-4 border-b border-gray-100 pb-12">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
               <span>Draft Management</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">Edit story.</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Title */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Story Title</label>
            <Input
              placeholder="Give your story a compelling title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-2xl font-bold h-16 border-none px-0 focus-visible:ring-0 placeholder:text-gray-200"
            />
          </div>

          {/* Featured Image */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Featured Image</label>
            <div className="border border-dashed border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50 p-8 transition-colors hover:border-gray-300">
              {imageUrl ? (
                <div className="space-y-6 text-center">
                  <img
                    src={imageUrl}
                    alt="Featured"
                    className="w-full h-64 object-cover rounded-xl shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(null); setFile(null); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove and replace image
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-400">
                    Upload a high-quality featured image for your story.
                  </p>
                  <label className="cursor-pointer inline-block">
                    <span className="px-10 h-10 flex items-center justify-center bg-white border border-gray-100 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const selectedFile = e.target.files?.[0]
                        if (selectedFile) {
                          setFile(selectedFile)
                          setImageUrl(URL.createObjectURL(selectedFile))
                        }
                      }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Story Content</label>
            </div>
            <textarea
              placeholder="What's on your mind?"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={25}
              className="w-full px-0 border-none text-gray-800 text-lg leading-relaxed focus:outline-none placeholder:text-gray-200 resize-none"
            />
          </div>

          {/* Actions */}
          <footer className="flex flex-col-reverse sm:flex-row items-center justify-end gap-6 pt-12 border-t border-gray-100">
            <button
               type="button"
               onClick={() => window.history.back()}
               className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors"
            >
                Discard Changes
            </button>
            <Button
              type="submit"
              disabled={saving || uploading}
              className="w-full sm:w-auto bg-gray-900 text-white rounded-full h-12 px-12 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
            >
              {saving ? '...' : (uploading ? 'Uploading Image...' : 'Save and Update')}
            </Button>
          </footer>
        </form>
      </main>
    </div>
  )
}
