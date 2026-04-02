'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { User } from '@/types'

interface UserContextType {
  user: User | null
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createBrowserClient()

    async function fetchUser() {
      // Small debounce delay if multiple triggers occur quickly
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser || !authUser.id) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('id', authUser.id)
        .maybeSingle()

      if (mounted) {
        setUser(profile as User | null)
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
