import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import './marketing.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Vibe CRM — Relationships at the speed of work',
    template: '%s · Vibe CRM',
  },
  description:
    'Pipeline, clients, and tasks in one calm workspace. Built for agencies, freelancers, and service teams who move fast.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`marketing-root ${fraunces.variable} ${sora.variable}`}>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
