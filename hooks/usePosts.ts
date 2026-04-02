"use client"

import { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Post } from '@/types'

interface Options {
	search?: string
	page?: number
	pageSize?: number
}

export default function usePosts({ search = '', page = 1, pageSize = 10 }: Options = {}) {
	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const supabase = createBrowserClient()

	useEffect(() => {
		let mounted = true
		setLoading(true)
		setError(null)

		;(async () => {
			try {
				const query = supabase.from('posts').select('*')
				if (search && search.trim() !== '') {
					query.ilike('title', `%${search}%`)
				}
				query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1)

				const { data, error } = await query
				if (error) throw error
				if (!mounted) return
				setPosts(data ?? [])
			} catch (err: any) {
				console.error('usePosts error', err)
				if (mounted) setError(err.message ?? 'Failed to load posts')
			} finally {
				if (mounted) setLoading(false)
			}
		})()

		return () => { mounted = false }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, page, pageSize])

	return { posts, loading, error }
}
