'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import useUser from '@/hooks/useUser'
import { toast } from 'sonner'
import { canCreatePost, canViewAdminDashboard } from '@/lib/rbac'

export default function Navbar() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Standard Next.js pattern to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/')
    router.refresh()
  }

  // We still want to render the skeleton/basic structure for SEO/LCP,
  // but if the hydration mismatch is severe (like a whole version difference),
  // we can safeguard it.
  if (!mounted) {
    // Render a minimal placeholder or nothing on simple server pass if mismatch persists,
    // though Next.js should ideally sync soon.
  }

  return (
    <nav className="border-b bg-white border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 hover:opacity-80 transition-opacity">
          Hivon
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Home
          </Link>

          {mounted && canViewAdminDashboard(user) && (
            <Link href="/dashboard/admin" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Admin
            </Link>
          )}

          {mounted && user?.role === 'author' && (
            <Link href="/dashboard/author" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              My Posts
            </Link>
          )}

          {mounted && user?.role === 'viewer' && (
            <Link href="/dashboard/reader" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Activity
            </Link>
          )}

          {mounted && !loading && (
            <div className="h-4 w-px bg-gray-200" />
          )}

          {mounted && !loading && (
            <>
              {user ? (
                <div className="flex items-center gap-6">
                  {/* Role Badge */}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-gray-200 text-gray-400 bg-gray-50`}>
                    {user.role}
                  </span>

                  <span className="text-sm font-medium text-gray-700">
                    {user.name.split(' ')[0]}
                  </span>

                  {canCreatePost(user) && (
                    <Link href="/blog/new">
                      <Button size="sm" variant="outline" className="text-xs h-8 px-3 border-gray-200">
                        + New Post
                      </Button>
                    </Link>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8 px-0 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-transparent"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Link href="/login">
                    <Button size="sm" variant="ghost" className="text-xs h-8 px-0 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-transparent">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="text-xs h-8 px-4 rounded-full bg-gray-900 text-white hover:bg-black">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
          <Link href="/" className="block text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
            Home
          </Link>

          {mounted && canViewAdminDashboard(user) && (
            <Link href="/dashboard/admin" className="block text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
              Admin Dashboard
            </Link>
          )}

          {mounted && user?.role === 'author' && (
            <Link href="/dashboard/author" className="block text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
              My Posts
            </Link>
          )}

          {mounted && user?.role === 'viewer' && (
            <Link href="/dashboard/reader" className="block text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
              My Activity
            </Link>
          )}

          {mounted && canCreatePost(user) && (
            <Link href="/blog/new" className="block text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
              + New Post
            </Link>
          )}

          <div className="pt-2 border-t border-gray-50 flex flex-col gap-2">
            {mounted && user ? (
                <Button size="sm" variant="ghost" className="text-xs h-9 justify-start text-gray-500" onClick={handleLogout}>
                    Logout
                </Button>
            ) : (
                <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button size="sm" variant="ghost" className="text-xs h-9 w-full justify-start text-gray-500">Login</Button>
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button size="sm" className="text-xs h-9 w-full rounded-md bg-gray-900 text-white hover:bg-black">Sign Up</Button>
                </Link>
                </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}