'use client'

import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, selected, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-lg border p-4 transition-all',
          selected ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-200 hover:border-gray-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
