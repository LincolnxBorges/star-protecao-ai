import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-all outline-none cursor-default",
  {
    variants: {
      variant: {
        filled:
          "bg-light-green-500 text-white hover:bg-light-green-600 dark:bg-light-green-400 dark:text-dark-green-900 dark:hover:bg-light-green-300",
        "filled-secondary":
          "bg-grey-200 text-grey-700 hover:bg-grey-300 dark:bg-grey-700 dark:text-grey-200 dark:hover:bg-grey-600",
        "filled-success":
          "bg-light-green-100 text-light-green-800 hover:bg-light-green-200 dark:bg-light-green-900 dark:text-light-green-200 dark:hover:bg-light-green-800",
        "filled-warning":
          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800",
        "filled-error":
          "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800",
        "filled-info":
          "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800",
        outline:
          "border border-light-green-500 text-light-green-700 hover:bg-light-green-50 dark:border-light-green-400 dark:text-light-green-400 dark:hover:bg-light-green-900/30",
        "outline-secondary":
          "border border-grey-300 text-grey-600 hover:bg-grey-100 dark:border-grey-600 dark:text-grey-400 dark:hover:bg-grey-800",
        "outline-success":
          "border border-light-green-500 text-light-green-700 hover:bg-light-green-50 dark:border-light-green-400 dark:text-light-green-400 dark:hover:bg-light-green-900/30",
        "outline-warning":
          "border border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
        "outline-error":
          "border border-red-500 text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30",
        "outline-info":
          "border border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30",
      },
      size: {
        sm: "h-6 px-2 text-xs",
        default: "h-7 px-3 text-sm",
        lg: "h-8 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
)

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void
  removable?: boolean
}

function Chip({
  className,
  variant,
  size,
  children,
  onRemove,
  removable = false,
  ...props
}: ChipProps) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "ml-0.5 rounded-full p-0.5 transition-colors outline-none",
            "hover:bg-black/10 dark:hover:bg-white/10",
            "focus-visible:ring-2 focus-visible:ring-offset-1",
            size === "sm" && "[&_svg]:size-3",
            size === "default" && "[&_svg]:size-3.5",
            size === "lg" && "[&_svg]:size-4"
          )}
          aria-label="Remove"
        >
          <X aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

export { Chip, chipVariants }
