import { ReactNode } from 'react';
import { LogoMark } from '@/components/brand/logo-mark';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthShell({ title, description, children, footer, className }: AuthShellProps) {
  return (
    <div className={cn('studio-surface studio-rail overflow-hidden pl-6', className)}>
      <div className="space-y-6 p-6 pl-5">
        <div className="space-y-4">
          <LogoMark size="md" />
          <div className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight text-amber-50/95">{title}</h1>
            {description && (
              <p className="text-[12px] leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-amber-950/40" />
      <span className="studio-label">or</span>
      <div className="h-px flex-1 bg-amber-950/40" />
    </div>
  );
}

export function AuthFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
      {children}
    </div>
  );
}
