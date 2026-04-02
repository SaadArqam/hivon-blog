"use client"

import { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Post } from '@/types'

interface Options {
	search?: string
	page?: number
}

export default function usePosts({ search = '', page = 1 }: Options = {}) {
	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
 
	const pageSize = 6

	useEffect(() => {
		let mounted = true
		const supabase = createBrowserClient()
		setLoading(true)
		setError(null)

		;(async () => {
			try {
				let query = supabase
					.from('posts')
					.select(`
						*,
						author:users(id, name, email, role, created_at)
					`)
					.eq('status', 'published')
				
				if (search && search.trim() !== '') {
					query = query.ilike('title', `%${search}%`)
				}
				
				const { data, error } = await query
					.order('created_at', { ascending: false })
					.range((page - 1) * pageSize, page * pageSize - 1)

				if (error) throw error
				if (!mounted) return
				setPosts((data ?? []) as Post[])
			} catch (err: unknown) {
				console.error('usePosts error', err)
				if (mounted) {
					if (err instanceof Error) setError(err.message ?? 'Failed to load posts')
					else setError('Failed to load posts')
				}
			} finally {
				if (mounted) setLoading(false)
			}
		})()

		return () => { mounted = false }
	}, [search, page, pageSize])

	return { posts, loading, error }
}
