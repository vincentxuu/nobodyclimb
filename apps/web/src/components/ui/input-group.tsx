import * as React from 'react'
import { cn } from '@/lib/utils'

const InputGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center rounded-md border border-input shadow-xs focus-within:ring-1 focus-within:ring-ring',
        '[&>input]:border-0 [&>input]:shadow-none focus-visible:[&>input]:ring-0',
        className
      )}
      {...props}
    />
  )
)
InputGroup.displayName = 'InputGroup'

const InputGroupText = React.forwardRef<HTMLSpanElement, React.ComponentProps<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('flex items-center px-3 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
InputGroupText.displayName = 'InputGroupText'

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    align?: 'block-start' | 'block-end' | 'inline-start' | 'inline-end'
  }
>(({ className, align: _align, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center px-2', className)} {...props} />
))
InputGroupAddon.displayName = 'InputGroupAddon'

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string
    size?: string
  }
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
))
InputGroupButton.displayName = 'InputGroupButton'

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex w-full resize-none border-0 bg-transparent px-3 py-2 text-sm shadow-none placeholder:text-muted-foreground focus:outline-hidden focus:ring-0',
      className
    )}
    {...props}
  />
))
InputGroupTextarea.displayName = 'InputGroupTextarea'

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea }
