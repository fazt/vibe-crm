import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-5', className)}>
      {(title || description) && (
        <div className="space-y-1 border-b studio-divider pb-3">
          {title && <h3 className="studio-label">{title}</h3>}
          {description && (
            <p className="text-[11px] text-muted-foreground/90">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t studio-divider pt-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
