import * as React from 'react'
import { cn } from '@/lib/utils'

const ButtonGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex -space-x-px rounded-lg shadow-xs shadow-black/5 rtl:space-x-reverse',
        '*:rounded-none [&>*:first-child]:rounded-s-lg [&>*:last-child]:rounded-e-lg',
        className
      )}
      role="group"
      {...props}
    />
  )
)
ButtonGroup.displayName = 'ButtonGroup'

const ButtonGroupText = React.forwardRef<HTMLSpanElement, React.ComponentProps<'span'>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('flex items-center px-2 text-sm', className)} {...props} />
  )
)
ButtonGroupText.displayName = 'ButtonGroupText'

export { ButtonGroup, ButtonGroupText }
