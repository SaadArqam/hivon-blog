import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import Skeleton from '@/components/ui/skeleton'
import { Post } from '@/types'

interface HomePageProps {
  searchParams: Promise<{ search?: string; page?: string; tag?: string }>
}

const POSTS_PER_PAGE = 6

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const search = params.search ?? ''
  const page = parseInt(params.page ?? '1')
  const tag = params.tag ?? ''
  const from = (page - 1) * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  let query = supabase
    .from('posts')
    .select('*, author:users(name)', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('title', '%' + search + '%')
  }

  const { data: posts, count } = await query
  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE)

  function getPaginationHref(p: number) {
    if (search) {
      return '/?page=' + p + '&search=' + search
    }
    return '/?page=' + p
  }

  function getPageClass(p: number) {
    const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors '
    if (p === page) {
      return base + 'bg-blue-600 text-white'
    }
    return base + 'border hover:bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Hivon Blog
          </h1>
          <p className="text-gray-500 text-lg">
            Thoughts, ideas, and stories from our community
          </p>
        </div>

        {/* Search */}
        <form className="mb-8 flex gap-2 max-w-md mx-auto">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search posts..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <a
              href="/"
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Clear
            </a>
          )}
        </form>

        {/* Posts Grid */}
        {!posts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg">No posts found</div>
            <div className="text-gray-400 text-sm mt-2">
              {search ? `No results for "${search}"` : 'No posts published yet'}
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post as Post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={getPaginationHref(p)}
                    className={getPageClass(p)}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}