import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  label?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, label, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1.5">
        {label && (
          <p className="studio-label flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary/70" />
            {label}
          </p>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="max-w-xl text-[12px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
