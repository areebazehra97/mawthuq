import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.15em] border",
  {
    variants: {
      variant: {
        neutral: "bg-surface-2 text-muted-foreground border-border",
        success: "bg-success/10 text-success border-success/30",
        warning: "bg-warning/15 text-warning-foreground border-warning/40",
        danger: "bg-destructive/10 text-destructive border-destructive/30",
        accent: "bg-accent/10 text-accent border-accent/30",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
