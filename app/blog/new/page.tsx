'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
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
          image_url: imageUrl,
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
      router.push('/blog/' + data.slug)
      router.refresh()

    } catch {
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border shadow-sm p-8 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
            <p className="text-sm text-gray-500 mt-1">
              An AI summary will be automatically generated when you publish
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Post Title *
            </label>
            <Input
              placeholder="Enter a compelling title..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="text-lg"
            />
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Featured Image
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              {imageUrl ? (
                <div className="space-y-3">
                  <img
                    src={imageUrl}
                    alt="Featured"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setImageUrl('')}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-4xl mb-2">🖼️</p>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload a featured image for your post
                  </p>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Post Content *
              </label>
              <span className="text-xs text-gray-400">
                {wordCount} words
              </span>
            </div>
            <textarea
              placeholder="Write your post content here... (minimum 50 characters)"
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* AI Notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <p className="text-sm font-medium text-blue-800">
                AI Summary Generation
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                When you publish, Google Gemini will automatically generate
                a ~200 word summary and store it. It will appear on the
                post listing page for readers.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={loading || uploading}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit('published')}
              disabled={loading || uploading}
              className="min-w-32"
            >
              {loading ? '✨ Publishing...' : 'Publish Post'}
            </Button>
          </div>

        </div>
      </main>
    </div>
  )
}