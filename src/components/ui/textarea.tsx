import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded border bg-transparent px-3 py-2 text-base",
        "transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",

        // States
        "hover:border-[#2694C6]",
        "focus:border-[#2694C6] focus:shadow-none focus:outline-none",
        "active:border-[#2694C6] active:shadow-none active:outline-none",

        // Validation states
        "aria-invalid:border-destructive",

        className
      )}
      {...props}
    />
  )
}

export { Textarea }
