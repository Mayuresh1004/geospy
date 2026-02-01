import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantic variants mapping to colors for compatibility
        blue: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25",
        green: "border-transparent bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25",
        red: "border-transparent bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25",
        yellow: "border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/25",
        purple: "border-transparent bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/25",
        gray: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray"; // Backwards compatibility
}

function Badge({ className, variant, color, ...props }: BadgeProps) {
  // Map legacy 'color' prop to 'variant' if 'variant' is not explicitly provided
  const finalVariant = variant || (color as any) || "default";

  return (
    <div className={cn(badgeVariants({ variant: finalVariant }), className)} {...props} />
  )
}

export default Badge
export { badgeVariants }