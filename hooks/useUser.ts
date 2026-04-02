"use client"

import { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export default function useUser() {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState<boolean>(true)
	const supabase = createBrowserClient()

	useEffect(() => {
		let mounted = true

		async function fetchUser() {
			setLoading(true)
			const { data } = await supabase.auth.getUser()
			const authUser = data.user
			if (!authUser) {
				if (mounted) setUser(null)
				setLoading(false)
				return
			}

			const { data: profile } = await supabase.from('users').select('id, name, email, role, created_at').eq('id', authUser.id).maybeSingle()
			if (mounted) setUser(profile ?? null)
			setLoading(false)
		}

		fetchUser()

		const { data: listener } = supabase.auth.onAuthStateChange((_event, _session) => {
			fetchUser()
		})

		return () => {
			mounted = false
			listener?.subscription.unsubscribe()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return { user, loading }
}

