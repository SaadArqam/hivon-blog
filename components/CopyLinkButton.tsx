'use client'
import { toast } from 'sonner'
import { Link as LinkIcon } from 'lucide-react'

export default function CopyLinkButton() {
  function handleCopy() {
    try {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
    >
      <LinkIcon size={14} />
      Copy link
    </button>
  )
}
