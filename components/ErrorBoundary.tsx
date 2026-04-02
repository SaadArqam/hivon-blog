'use client'

import React from 'react'

interface State {
  hasError: boolean
  error: Error | null
}

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ hasError: true, error })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-red-600 text-lg font-semibold mb-2">
              Something went wrong
            </div>
            <div className="text-gray-600 text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            {this.props.fallback && (
              <div className="mt-4">
                {this.props.fallback}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
