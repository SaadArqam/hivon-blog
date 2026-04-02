import { User, Role } from '@/types'

/**
 * Role-Based Access Control (RBAC) Helper Functions
 */

export const ROLES = {
  VIEWER: 'viewer' as Role,
  AUTHOR: 'author' as Role,
  ADMIN: 'admin' as Role,
} as const

/**
 * Check if user has specific role
 */
export function hasRole(user: User | null, role: Role): boolean {
  return user?.role === role
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: Role[]): boolean {
  return user ? roles.includes(user.role) : false
}

/**
 * Check if user can create posts
 */
export function canCreatePost(user: User | null): boolean {
  return hasAnyRole(user, [ROLES.AUTHOR, ROLES.ADMIN])
}

/**
 * Check if user can edit a specific post
 */
export function canEditPost(user: User | null, postAuthorId: string): boolean {
  if (!user) return false
  return user.role === ROLES.ADMIN || user.id === postAuthorId
}

/**
 * Check if user can delete a specific post
 */
export function canDeletePost(user: User | null, postAuthorId: string): boolean {
  if (!user) return false
  return user.role === ROLES.ADMIN || user.id === postAuthorId
}

/**
 * Check if user can view admin dashboard
 */
export function canViewAdminDashboard(user: User | null): boolean {
  return hasRole(user, ROLES.ADMIN)
}

/**
 * Check if user can comment (all authenticated users)
 */
export function canComment(user: User | null): boolean {
  return !!user
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case ROLES.ADMIN:
      return 'Administrator'
    case ROLES.AUTHOR:
      return 'Author'
    case ROLES.VIEWER:
      return 'Reader'
    default:
      return 'Unknown'
  }
}

/**
 * Get role badge classes
 */
export function getRoleBadgeClasses(role: Role): string {
  switch (role) {
    case ROLES.ADMIN:
      return 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800'
    case ROLES.AUTHOR:
      return 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800'
    case ROLES.VIEWER:
      return 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800'
    default:
      return 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800'
  }
}

/**
 * Get role permissions summary
 */
export function getRolePermissions(role: Role): string[] {
  switch (role) {
    case ROLES.ADMIN:
      return [
        '✅ View all posts',
        '✅ Edit any post',
        '✅ Delete any post',
        '✅ View all comments',
        '✅ Hide comments',
        '✅ Create posts',
        '✅ Comment on posts',
        '✅ Access admin dashboard'
      ]
    case ROLES.AUTHOR:
      return [
        '✅ View published posts',
        '✅ Create posts',
        '✅ Edit own posts',
        '✅ Delete own posts',
        '✅ Comment on posts',
        '❌ Cannot edit others posts',
        '❌ Cannot access admin dashboard'
      ]
    case ROLES.VIEWER:
      return [
        '✅ View published posts',
        '✅ Comment on posts',
        '❌ Cannot create posts',
        '❌ Cannot edit posts',
        '❌ Cannot access admin dashboard'
      ]
    default:
      return []
  }
}
