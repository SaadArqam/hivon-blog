'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [form, setForm] = useState({
    title: '',
    body: '',
    status: 'published' as 'published' | 'draft',
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = Math.random().toString(36).slice(2) + '.' + fileExt

    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file)

    if (error) {
      toast.error('Image upload failed')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path)

    setImageUrl(urlData.publicUrl)
    toast.success('Image uploaded!')
    setUploading(false)
  }

  async function handleSubmit(status: 'published' | 'draft') {
    if (!form.title.trim()) {
      toast.error('Please add a title')
      return
    }
    if (!form.body.trim() || form.body.length < 50) {
      toast.error('Post body must be at least 50 characters')
      return
    }

    setLoading(true)
    toast.info('Generating AI summary... this may take a moment ✨')

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          image_url: imageUrl || null,
          status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create post')
        setLoading(false)
        return
      }

      toast.success(
        status === 'published'
          ? 'Post published with AI summary!'
          : 'Draft saved!'
      )
      
      // Navigate to post listing or the new story page
      router.push('/blog/' + data.slug)
      router.refresh()

    } catch {
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="bg-white min-h-screen py-24 px-6">
      <main className="max-w-2xl mx-auto space-y-16">
        <header className="space-y-4 border-b border-gray-100 pb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">Create a new story.</h1>
            <p className="text-gray-500 text-lg">Share your ideas with the world.</p>
        </header>

        <div className="space-y-12">
          {/* Title */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Story Title</label>
            <Input
              placeholder="Give your story a compelling title..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
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
                    onClick={() => setImageUrl('')}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove image
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
                      onChange={handleImageUpload}
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
              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                {wordCount} words
              </span>
            </div>
            <textarea
              placeholder="Once upon a time..."
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              rows={20}
              className="w-full px-0 border-none text-gray-800 text-lg leading-relaxed focus:outline-none placeholder:text-gray-200 resize-none"
            />
          </div>

          {/* AI Notice */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex items-start gap-4">
            <span className="text-xl">🤖</span>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">
                AI Summary Generation
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                When you publish, Google Gemini will automatically analyze your content to generate an AI Insight summary.
              </p>
            </div>
          </div>

          {/* Actions */}
          <footer className="flex flex-col-reverse sm:flex-row items-center justify-end gap-6 pt-12 border-t border-gray-100">
            <button
               onClick={() => router.back()}
               className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors"
            >
                Cancel
            </button>
            <div className="flex gap-4 w-full sm:w-auto">
               <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={loading || uploading}
                className="flex-1 sm:flex-none border-gray-100 rounded-full h-12 px-8 text-[10px] font-bold uppercase tracking-widest"
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                disabled={loading || uploading}
                className="flex-1 sm:flex-none bg-gray-900 text-white rounded-full h-12 px-12 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
              >
                {loading ? '...' : 'Publish Story'}
              </Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}