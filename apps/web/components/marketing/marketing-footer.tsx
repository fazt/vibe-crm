import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo-mark';

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/register', label: 'Get started' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/login', label: 'Sign in' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/6">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size="sm" />
              <span className="text-sm font-semibold text-[#f4f0e8]">Vibe CRM</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#8b8f9a]">
              A calm command center for client relationships. Pipeline, tasks, and context — without the enterprise
              baggage.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="mkt-label mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[#8b8f9a] transition-colors hover:text-[#f4f0e8]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/6 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-[#8b8f9a]">© {new Date().getFullYear()} Vibe CRM. All rights reserved.</p>
          <p className="mkt-label">Built for teams that ship</p>
        </div>
      </div>
    </footer>
  );
}
