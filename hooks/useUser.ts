"use client"

import { useUser as useUserContext } from '@/context/UserContext'

/**
 * useUser hook that consumes the global UserContext state.
 * This prevents redundant Supabase auth token locking issues
 * and ensures that all components see the same user profile information.
 */
export default function useUser() {
  return useUserContext()
}
