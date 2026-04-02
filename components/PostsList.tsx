'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { Post } from '@/types'
import Skeleton from '@/components/ui/skeleton'

interface PostsListProps {
  posts: (Post & { author?: { name: string } })[]
  totalPages: number
  currentPage: number
  search?: string
}

export default function PostsList({ 
  posts, 
  totalPages, 
  currentPage, 
  search 
}: PostsListProps) {
  const router = useRouter()

  function handlePostDeleted() {
    // Refresh the page to show updated posts list
    router.refresh()
  }

  return (
    <>
      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onDelete={handlePostDeleted}
          />
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-500">
            {search 
              ? `No posts found for "${search}". Try a different search term.` 
              : 'No posts published yet. Be the first to share your thoughts!'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {currentPage > 1 && (
            <a
              href={search ? `/?search=${search}&page=${currentPage - 1}` : `/?page=${currentPage - 1}`}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Previous
            </a>
          )}
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors '
            const isActive = p === currentPage
            const className = isActive 
              ? base + 'bg-blue-600 text-white'
              : base + 'border hover:bg-gray-100'
            
            return (
              <a
                key={p}
                href={search ? `/?search=${search}&page=${p}` : `/?page=${p}`}
                className={className}
              >
                {p}
              </a>
            )
          })}
          
          {currentPage < totalPages && (
            <a
              href={search ? `/?search=${search}&page=${currentPage + 1}` : `/?page=${currentPage + 1}`}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </>
  )
}
