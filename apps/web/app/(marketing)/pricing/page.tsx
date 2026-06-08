import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingPlans } from '@/components/marketing/pricing-plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for freelancers, studios, and growing teams.',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function fetchPlans() {
  try {
    const res = await fetch(`${API_BASE}/billing/plans`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json() as Promise<{
      configured: boolean;
      trialDays: number;
      plans: Parameters<typeof PricingPlans>[0]['plans'];
    }>;
  } catch {
    return { configured: false, trialDays: 14, plans: [] };
  }
}

const faqs = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes. Upgrade or downgrade anytime. Changes apply on your next billing cycle.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Studio includes a 14-day trial with full features. No credit card required to start Solo.',
  },
  {
    q: 'What counts as a workspace?',
    a: 'A workspace is an isolated environment with its own clients, pipeline, and team. Perfect for separate brands or clients.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Annual plans save up to 20%. Toggle annual pricing above to see current rates.',
  },
];

export default async function PricingPage() {
  const { plans, configured, trialDays } = await fetchPlans();

  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mkt-label mb-4">Pricing</p>
          <h1 className="mkt-display text-4xl font-semibold tracking-tight text-[var(--mkt-paper)] md:text-5xl">
            Pay for momentum, not seats you don&apos;t use
          </h1>
          <p className="mt-4 text-[var(--mkt-mist)]">
            Start free. Scale when your pipeline does. Every plan includes the core CRM — pipeline, tasks, and
            activity.
          </p>
        </div>

        {plans.length > 0 ? (
          <PricingPlans plans={plans} configured={configured} trialDays={trialDays} />
        ) : (
          <p className="mt-12 text-center text-[var(--mkt-mist)]">Unable to load pricing. Please try again later.</p>
        )}

        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mkt-label mb-4">FAQ</p>
            <h2 className="mkt-display text-2xl font-semibold text-[var(--mkt-paper)]">Common questions</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="mkt-card px-6 py-5">
                <h3 className="text-sm font-semibold text-[var(--mkt-paper)]">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-mist)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-sm text-[var(--mkt-mist)]">
            Need a custom setup for a larger team?{' '}
            <Link href="/contact" className="text-[var(--mkt-signal)] hover:underline">
              Get in touch
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
