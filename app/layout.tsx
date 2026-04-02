import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/ErrorBoundary'
import Navbar from '@/components/Navbar'
import { UserProvider } from '@/context/UserContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hivon Blog',
  description: 'A modern blogging platform with AI-powered summaries',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-red-600">Application error. Please refresh the page.</div>
          </div>
        }>
          <UserProvider>
            <Navbar />
            <main className="min-h-screen">
                {children}
            </main>
            <Toaster position="top-right" richColors />
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}