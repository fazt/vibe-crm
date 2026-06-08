import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border studio-divider bg-stone-900/60 text-foreground',
        destructive: 'border-transparent bg-destructive/90 text-destructive-foreground',
        outline: 'border studio-divider text-foreground',
        success: 'border-emerald-800/35 bg-emerald-950/40 text-emerald-300',
        warning: 'border-amber-800/35 bg-amber-950/45 text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} />;
}

export { Badge, badgeVariants };
