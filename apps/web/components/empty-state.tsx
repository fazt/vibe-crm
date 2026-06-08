import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed studio-divider bg-stone-950/25 py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border studio-divider bg-amber-950/25">
        <Icon className="h-5 w-5 text-amber-200/50" />
      </div>
      <h3 className="text-sm font-medium text-amber-50/90">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Button asChild size="sm" className="mt-5">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
