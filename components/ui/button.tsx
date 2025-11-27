import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-light-green-600 active:bg-light-green-700 dark:hover:bg-light-green-300 dark:active:bg-light-green-200",
        destructive:
          "bg-destructive text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive dark:hover:bg-red-300 dark:active:bg-red-200",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-primary dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:hover:border-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-grey-200 active:bg-grey-300 dark:hover:bg-grey-700 dark:active:bg-grey-600",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-light-green-200 dark:hover:bg-accent/50 dark:active:bg-dark-green-600",
        link: "text-primary underline-offset-4 hover:underline hover:text-light-green-600 dark:hover:text-light-green-300",
        success:
          "bg-light-green-500 text-white hover:bg-light-green-600 active:bg-light-green-700 dark:bg-light-green-400 dark:text-dark-green-900 dark:hover:bg-light-green-300 dark:active:bg-light-green-200",
        warning:
          "bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 dark:bg-yellow-400 dark:text-yellow-900 dark:hover:bg-yellow-300 dark:active:bg-yellow-200",
        info:
          "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-400 dark:text-blue-900 dark:hover:bg-blue-300 dark:active:bg-blue-200",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-6",
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
