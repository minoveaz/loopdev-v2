import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:h-3 [&>svg]:w-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border bg-card text-foreground",
        // Soft tonal variants — preferred for status pills
        success: "border-transparent bg-success/10 text-success ring-1 ring-inset ring-success/20",
        warning: "border-transparent bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
        info: "border-transparent bg-info/10 text-info ring-1 ring-inset ring-info/20",
        soft: "border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/15",
        muted: "border-transparent bg-muted text-muted-foreground ring-1 ring-inset ring-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
