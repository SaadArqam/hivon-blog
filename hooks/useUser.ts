"use client"

import { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export default function useUser() {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		let mounted = true
		const supabase = createBrowserClient()

		async function fetchUser() {
			setLoading(true)
			const authRes = await supabase.auth.getUser()
			const authUser = authRes.data?.user as { id?: string } | null
			if (!authUser || !authUser.id) {
				if (mounted) setUser(null)
				setLoading(false)
				return
			}

			const profileRes = await supabase
				.from('users')
				.select('id, name, email, role, created_at')
				.eq('id', authUser.id)
				.maybeSingle()
			const profile = profileRes.data as User | null
			if (mounted) setUser(profile ?? null)
			setLoading(false)
		}

		fetchUser()

		const { data: listener } = supabase.auth.onAuthStateChange(() => {
			fetchUser()
		})

		return () => {
			mounted = false
			listener?.subscription.unsubscribe()
		}
	}, [])

	return { user, loading }
}

