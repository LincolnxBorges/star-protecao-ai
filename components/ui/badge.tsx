import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-light-green-600 dark:hover:bg-light-green-300",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-grey-200 dark:hover:bg-grey-700",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600 dark:bg-red-400 dark:text-red-900 dark:hover:bg-red-300",
        outline:
          "text-foreground border-border hover:bg-muted",
        success:
          "border-transparent bg-light-green-500 text-white hover:bg-light-green-600 dark:bg-light-green-400 dark:text-dark-green-900 dark:hover:bg-light-green-300",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-400 dark:text-yellow-900 dark:hover:bg-yellow-300",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-blue-900 dark:hover:bg-blue-300",
        "outline-success":
          "border-light-green-500 text-light-green-700 hover:bg-light-green-50 dark:border-light-green-400 dark:text-light-green-400 dark:hover:bg-light-green-900/30",
        "outline-destructive":
          "border-red-500 text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30",
        "outline-warning":
          "border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
        "outline-info":
          "border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
