import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PostsList from '@/components/PostsList'
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

  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
            Explore stories.
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Thought-provoking articles, curated by humans and summarized by AI. A minimalist space for professional publishing.
          </p>
        </div>

        {/* Search */}
        <form className="mb-16 flex gap-3 max-w-lg mx-auto">
          <div className="relative flex-1 group">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by title..."
              className="w-full px-5 py-3 rounded-full border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all group-hover:border-gray-300"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
          >
            Search
          </button>
          {search && (
            <Link
              href="/"
              className="px-6 py-3 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Posts Grid */}
        {!posts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-6">
                <Skeleton className="h-52 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-100 rounded-2xl">
            <div className="text-gray-400 text-lg font-medium">No stories found.</div>
            <div className="text-gray-400 text-sm mt-2">
              {search ? `Try a different keyword than "${search}"` : 'Be the first to publish a story.'}
            </div>
            {search && (
                <Link href="/" className="inline-block mt-6 text-sm font-semibold text-gray-900 hover:underline">
                    Back to all stories
                </Link>
            )}
          </div>
        ) : (
          <PostsList 
            posts={posts as (Post & { author?: { name: string } })[]}
            totalPages={totalPages}
            currentPage={page}
            search={search}
          />
        )}
      </main>
    </div>
  )
}