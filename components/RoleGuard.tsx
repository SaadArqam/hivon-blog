"use client"

import React, { ReactNode, useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Role } from '@/types'

interface Props {
  allowedRoles: Role[]
  fallback?: ReactNode
  children: ReactNode
}

export default function RoleGuard({ allowedRoles, fallback = null, children }: Props) {
  const [loading, setLoading] = useState(true)
  const [hasRole, setHasRole] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        if (mounted) setHasRole(false)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      if (mounted) setHasRole(allowedRoles.includes(profile?.role))
      setLoading(false)
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allowedRoles)])

  if (loading) return null
  if (!hasRole) return <>{fallback}</>
  return <>{children}</>
}
