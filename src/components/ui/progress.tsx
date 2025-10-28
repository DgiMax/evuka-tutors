'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

// ✅ Add indicatorClassName to the props type
interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string; // Optional prop for indicator styles
}

// ✅ Use the extended props type
function Progress({
  className,
  value,
  indicatorClassName, // Get the prop
  ...props
}: ProgressProps) { // Use ProgressProps
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', // Your default styles
        className, // Apply className to the root
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
            'bg-primary h-full w-full flex-1 transition-all', // Default indicator styles
            indicatorClassName // ✅ Apply the indicatorClassName here
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }