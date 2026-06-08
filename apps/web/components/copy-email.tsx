'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyEmailProps {
  email: string;
  className?: string;
}

export function CopyEmail({ email, className }: CopyEmailProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-auto px-1.5 py-0.5 font-normal text-muted-foreground hover:text-foreground', className)}
      onClick={copy}
    >
      <span className="truncate">{email}</span>
      {copied ? <Check className="ml-1 h-3 w-3 text-emerald-400" /> : <Copy className="ml-1 h-3 w-3" />}
    </Button>
  );
}
