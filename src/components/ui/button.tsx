import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus:outline-none active:outline-none focus:shadow-none active:shadow-none",
  {
    variants: {
      variant: {
        // ✅ Primary button — your blue color
        default:
          "bg-[#2694C6] text-white hover:bg-[#1f7ca8] active:bg-[#1b6e96] border border-transparent",

        // Destructive button
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 border border-transparent",

        // Outline button
        outline:
          "border border-[#2694C6] text-[#2694C6] bg-transparent hover:bg-[#2694C6]/10 active:bg-[#2694C6]/20",

        // Secondary
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-transparent",

        // Ghost button
        ghost:
          "bg-transparent hover:bg-[#2694C6]/10 text-[#2694C6] border border-transparent",

        // Link style
        link: "text-[#2694C6] underline-offset-4 hover:underline border-0 bg-transparent",
      },

      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
