"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all outline-none",
        "data-[state=checked]:bg-light-green-500 data-[state=unchecked]:bg-grey-300",
        "hover:data-[state=checked]:bg-light-green-600 hover:data-[state=unchecked]:bg-grey-400",
        "focus-visible:ring-light-green-500/30 focus-visible:ring-[3px]",
        "dark:data-[state=checked]:bg-light-green-400 dark:data-[state=unchecked]:bg-grey-600",
        "dark:hover:data-[state=checked]:bg-light-green-300 dark:hover:data-[state=unchecked]:bg-grey-500",
        "dark:focus-visible:ring-light-green-400/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
          "dark:data-[state=unchecked]:bg-grey-200"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
