import * as React from 'react';
import { cn } from '@/lib/utils';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  rail?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Surface({
  className,
  interactive,
  rail,
  padding = 'md',
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        'studio-surface',
        rail && 'studio-rail pl-5',
        interactive && 'studio-surface-interactive',
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SurfaceHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b studio-divider px-5 py-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SurfaceBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}
