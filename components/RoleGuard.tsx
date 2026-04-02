"use client"

import React, { ReactNode } from 'react'
import useUser from '@/hooks/useUser'
import { Role } from '@/types'

interface Props {
  allowedRoles: Role[]
  fallback?: ReactNode
  children: ReactNode
}

export default function RoleGuard({ allowedRoles, fallback = null, children }: Props) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
  }

  const hasRole = user && allowedRoles.includes(user.role)

  if (!hasRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
