'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmationModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Dialog.Title className="text-xl font-bold tracking-tight text-gray-900">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm leading-relaxed text-gray-500">
                {description}
              </Dialog.Description>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors"
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                  "h-10 px-6 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  variant === 'default' && "bg-gray-900 text-white hover:bg-black",
                  variant === 'destructive' && "bg-red-500 text-white hover:bg-red-600 border-none"
                )}
              >
                {loading ? '...' : confirmText}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
