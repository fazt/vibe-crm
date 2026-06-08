import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DetailHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function DetailHeader({
  backHref,
  backLabel,
  title,
  description,
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <div className={cn('mb-7 space-y-4', className)}>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 text-[11px] text-muted-foreground hover:text-amber-100/80"
      >
        <Link href={backHref}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          {backLabel}
        </Link>
      </Button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-amber-50/95">{title}</h1>
          {description && (
            <p className="text-[12px] text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
