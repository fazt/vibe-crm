'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo-mark';
import { cn } from '@/lib/utils';

const links = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-[#08090d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size="sm" />
          <span className="text-sm font-semibold tracking-tight text-[#f4f0e8]">Vibe CRM</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors',
                pathname === link.href || (link.href === '/#features' && pathname === '/')
                  ? 'text-[#f4f0e8]'
                  : 'text-[#8b8f9a] hover:text-[#f4f0e8]',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="mkt-btn-ghost px-4 py-2 text-sm">
            Sign in
          </Link>
          <Link href="/register" className="mkt-btn-primary px-4 py-2 text-sm">
            Start free
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-[#8b8f9a] hover:bg-white/5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/6 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#8b8f9a] hover:text-[#f4f0e8]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" className="mkt-btn-ghost text-center text-sm" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link href="/register" className="mkt-btn-primary text-center text-sm" onClick={() => setOpen(false)}>
                Start free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
