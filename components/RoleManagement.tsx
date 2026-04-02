'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ROLES, getRoleBadgeClasses, getRoleDisplayName } from '@/lib/rbac'
import { toast } from 'sonner'
import type { User } from '@/types'

interface Props {
  users: User[]
  onUserUpdated: () => void
}

export default function RoleManagement({ users, onUserUpdated }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  async function updateUserRole(userId: string, newRole: string) {
    setLoading(userId)
    
    try {
      // Get current session token
      const response = await fetch('/api/auth/session')
      const session = await response.json()
      
      if (!session?.user) {
        throw new Error('Not authenticated')
      }

      // Call API to update role
      const updateResponse = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast.success(`User role updated to ${getRoleDisplayName(newRole as any)}`)
      onUserUpdated()
    } catch (error) {
      console.error('Failed to update user role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user role')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-medium">Role Management</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage user roles - Admin has full access, Author can create posts, Viewer can read only
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Current Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-gray-600">{user.email}</td>
                <td className="p-3">
                  <span className={getRoleBadgeClasses(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {Object.values(ROLES).map((role) => (
                      <Button
                        key={role}
                        size="sm"
                        variant={user.role === role ? "default" : "outline"}
                        onClick={() => updateUserRole(user.id, role)}
                        disabled={loading === user.id || user.role === role}
                        className="text-xs"
                      >
                        {loading === user.id ? '...' : getRoleDisplayName(role)}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
