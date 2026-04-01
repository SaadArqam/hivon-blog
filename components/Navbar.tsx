'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User } from '@/types'
import { toast } from 'sonner'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        setUser(data)
      }
      setLoading(false)
    }

    getUser()

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
          ✍️ Hivon Blog
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Home
          </Link>

          {user?.role === 'admin' && (
            <Link href="/dashboard/admin" className="text-sm text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          )}

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.role === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : user.role === 'author'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>

                  <span className="text-sm text-gray-600">
                    Hi, {user.name.split(' ')[0]}
                  </span>

                  {['author', 'admin'].includes(user.role) && (
                    <Link href="/blog/new">
                      <Button size="sm">+ New Post</Button>
                    </Link>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button size="sm" variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign Up</Button>
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
        <div className="md:hidden border-t px-4 py-3 space-y-3 bg-white">
          <Link href="/" className="block text-sm text-gray-600" onClick={() => setMenuOpen(false)}>
            Home
          </Link>

          {user?.role === 'admin' && (
            <Link href="/dashboard/admin" className="block text-sm text-gray-600" onClick={() => setMenuOpen(false)}>
              Admin Dashboard
            </Link>
          )}

          {['author', 'admin'].includes(user?.role ?? '') && (
            <Link href="/blog/new" className="block text-sm text-gray-600" onClick={() => setMenuOpen(false)}>
              + New Post
            </Link>
          )}

          {user ? (
            <Button size="sm" variant="outline" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button size="sm" variant="outline" className="w-full">Login</Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}