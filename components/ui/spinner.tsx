import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-200 border-t-gray-300',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading..."
    >
      <div className="border-t-transparent border-2 border-transparent border-b-transparent border-l-transparent animate-spin-fast">
        <div className="w-0 h-0 rounded-full border-2 border-transparent border-t-transparent border-b-transparent border-l-transparent"></div>
      </div>
    </div>
  )
}
