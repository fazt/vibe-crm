'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

interface PlanPrice {
  amount: number | null;
  currency: string;
  priceId?: string | null;
  savingsPercent?: number | null;
}

interface Plan {
  key: string;
  name: string;
  description: string;
  featured: boolean;
  cta: string;
  href: string;
  trialDays: number | null;
  features: string[];
  prices: {
    month: PlanPrice;
    year: PlanPrice & { savingsPercent?: number | null };
  };
}

interface PricingPlansProps {
  plans: Plan[];
  configured: boolean;
  trialDays: number;
}

function formatPrice(amount: number | null, currency: string) {
  if (amount === null) return '—';
  if (amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export function PricingPlans({ plans, configured, trialDays }: PricingPlansProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  const annualSavings = plans.find((p) => p.prices.year.savingsPercent)?.prices.year.savingsPercent;

  return (
    <>
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setInterval('month')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              interval === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              interval === 'year' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Annual{annualSavings ? ` (save ${annualSavings}%)` : ''}
          </button>
        </div>
      </div>

      {!configured && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Live billing prices will appear when Stripe is configured.
        </p>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const priceData = interval === 'month' ? plan.prices.month : plan.prices.year;
          const displayPrice = formatPrice(priceData.amount, priceData.currency);
          const period =
            plan.key === 'solo'
              ? 'forever'
              : interval === 'month'
                ? '/month'
                : '/year';

          return (
            <div
              key={plan.key}
              className={`mkt-card flex flex-col p-8 ${plan.featured ? 'mkt-card-featured relative lg:-mt-4 lg:mb-4' : ''}`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--mkt-signal)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--mkt-ink)]">
                  Most popular
                </span>
              )}
              <div>
                <h2 className="text-lg font-semibold text-[var(--mkt-paper)]">{plan.name}</h2>
                <p className="mt-1 text-sm text-[var(--mkt-mist)]">{plan.description}</p>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="mkt-display text-4xl font-semibold text-[var(--mkt-paper)]">
                  {displayPrice}
                </span>
                <span className="text-sm text-[var(--mkt-mist)]">{period}</span>
              </div>
              {plan.trialDays && interval === 'month' && (
                <p className="mt-2 text-xs text-[var(--mkt-signal)]">{plan.trialDays}-day free trial</p>
              )}
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[var(--mkt-mist)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mkt-signal)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 text-center ${plan.featured ? 'mkt-btn-primary' : 'mkt-btn-ghost'} w-full`}
              >
                {plan.key === 'studio' && trialDays ? `Start ${trialDays}-day trial` : plan.cta}
                {plan.featured && <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
