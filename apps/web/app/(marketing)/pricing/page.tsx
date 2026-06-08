import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for freelancers, studios, and growing teams.',
};

const plans = [
  {
    name: 'Solo',
    price: '$0',
    period: 'forever',
    description: 'For freelancers getting their pipeline in order.',
    featured: false,
    cta: 'Start free',
    href: '/register',
    features: [
      '1 workspace',
      'Up to 100 contacts',
      'Pipeline Kanban',
      'Tasks & reminders',
      'Activity log',
    ],
  },
  {
    name: 'Studio',
    price: '$29',
    period: '/month',
    description: 'For small teams closing deals together.',
    featured: true,
    cta: 'Start 14-day trial',
    href: '/register',
    features: [
      '3 workspaces',
      'Unlimited contacts',
      'Team members (up to 5)',
      'Email notifications',
      'File attachments',
      'Custom pipeline stages',
      'Priority support',
    ],
  },
  {
    name: 'Agency',
    price: '$79',
    period: '/month',
    description: 'For agencies managing multiple brands.',
    featured: false,
    cta: 'Contact sales',
    href: '/contact',
    features: [
      'Unlimited workspaces',
      'Unlimited team members',
      'Advanced permissions',
      'Stale deal alerts',
      'Overdue task digests',
      'API access',
      'Dedicated onboarding',
    ],
  },
];

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
    a: 'Annual plans save 20%. Contact us for agency volume pricing.',
  },
];

export default function PricingPage() {
  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mkt-label mb-4">Pricing</p>
          <h1 className="mkt-display text-4xl font-semibold tracking-tight text-[#f4f0e8] md:text-5xl">
            Pay for momentum, not seats you don&apos;t use
          </h1>
          <p className="mt-4 text-[#8b8f9a]">
            Start free. Scale when your pipeline does. Every plan includes the core CRM — pipeline, tasks, and
            activity.
          </p>
        </div>

        {/* Plans */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`mkt-card flex flex-col p-8 ${plan.featured ? 'mkt-card-featured relative lg:-mt-4 lg:mb-4' : ''}`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ff5c38] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#08090d]">
                  Most popular
                </span>
              )}
              <div>
                <h2 className="text-lg font-semibold text-[#f4f0e8]">{plan.name}</h2>
                <p className="mt-1 text-sm text-[#8b8f9a]">{plan.description}</p>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="mkt-display text-4xl font-semibold text-[#f4f0e8]">{plan.price}</span>
                <span className="text-sm text-[#8b8f9a]">{plan.period}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#8b8f9a]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5c38]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 text-center ${plan.featured ? 'mkt-btn-primary' : 'mkt-btn-ghost'} w-full`}
              >
                {plan.cta}
                {plan.featured && <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mkt-label mb-4">FAQ</p>
            <h2 className="mkt-display text-2xl font-semibold text-[#f4f0e8]">Common questions</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="mkt-card px-6 py-5">
                <h3 className="text-sm font-semibold text-[#f4f0e8]">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b8f9a]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 text-center">
          <p className="text-sm text-[#8b8f9a]">
            Need a custom setup for a larger team?{' '}
            <Link href="/contact" className="text-[#ff5c38] hover:underline">
              Get in touch
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
