import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/ErrorBoundary'
import Navbar from '@/components/Navbar'

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
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}