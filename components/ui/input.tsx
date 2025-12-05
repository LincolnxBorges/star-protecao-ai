import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-grey-400 dark:hover:border-grey-500",
        "focus-visible:border-light-green-500 focus-visible:ring-light-green-500/30 focus-visible:ring-[3px] dark:focus-visible:border-light-green-400 dark:focus-visible:ring-light-green-400/30",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/30",
        "data-[error=true]:border-red-500 data-[error=true]:ring-red-500/20 dark:data-[error=true]:border-red-400 dark:data-[error=true]:ring-red-400/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
