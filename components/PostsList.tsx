'use client'

import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { Post } from '@/types'

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
    router.refresh()
  }

  return (
    <>
      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onDelete={handlePostDeleted}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-20 pt-10 border-t border-gray-100">
          {currentPage > 1 && (
            <a
              href={search ? `/?search=${search}&page=${currentPage - 1}` : `/?page=${currentPage - 1}`}
              className="px-4 py-2 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:border-gray-900 transition-all"
            >
              ← Previous
            </a>
          )}
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = p === currentPage
                return (
                    <a
                        key={p}
                        href={search ? `/?search=${search}&page=${p}` : `/?page=${p}`}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                            isActive 
                                ? 'bg-gray-900 text-white' 
                                : 'text-gray-400 hover:text-black hover:bg-gray-50'
                        }`}
                    >
                        {p}
                    </a>
                )
            })}
          </div>
          
          {currentPage < totalPages && (
            <a
              href={search ? `/?search=${search}&page=${currentPage + 1}` : `/?page=${currentPage + 1}`}
              className="px-4 py-2 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:border-gray-900 transition-all"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </>
  )
}
