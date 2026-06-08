import { SubscriptionPlan } from './enums';
import { PLAN_LIMITS, type PlanLimitResource } from './plan-limits';

export type PlanKey = 'solo' | 'studio' | 'agency';

export interface PlanCatalogEntry {
  key: PlanKey;
  plan: SubscriptionPlan;
  name: string;
  description: string;
  cta: string;
  href: string;
  featured: boolean;
  trialDays: number | null;
  features: string[];
}

function formatLimit(value: number | null, label: string): string {
  if (value === null) return `Unlimited ${label}`;
  return `Up to ${value} ${label}`;
}

function buildFeatures(plan: SubscriptionPlan): string[] {
  const limits = PLAN_LIMITS[plan];
  const items: string[] = [
    formatLimit(limits.workspaces, 'workspaces'),
    formatLimit(limits.clients, 'clients'),
    formatLimit(limits.contacts, 'contacts'),
    formatLimit(limits.opportunities, 'opportunities'),
    formatLimit(limits.tasks, 'tasks'),
    'Pipeline Kanban',
    'Tasks & reminders',
    'Activity log',
  ];

  if (plan !== SubscriptionPlan.SOLO) {
    items.push(formatLimit(limits.members, 'team members'));
    items.push('File attachments');
    items.push('Custom pipeline stages');
    items.push('Email notifications');
  }

  if (plan === SubscriptionPlan.AGENCY) {
    items.push('Advanced permissions');
    items.push('Priority support');
  }

  return items;
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    key: 'solo',
    plan: SubscriptionPlan.SOLO,
    name: 'Solo',
    description: 'For freelancers getting their pipeline in order.',
    cta: 'Start free',
    href: '/register',
    featured: false,
    trialDays: null,
    features: buildFeatures(SubscriptionPlan.SOLO),
  },
  {
    key: 'studio',
    plan: SubscriptionPlan.STUDIO,
    name: 'Studio',
    description: 'For small teams closing deals together.',
    cta: 'Start 14-day trial',
    href: '/register?plan=studio',
    featured: true,
    trialDays: 14,
    features: buildFeatures(SubscriptionPlan.STUDIO),
  },
  {
    key: 'agency',
    plan: SubscriptionPlan.AGENCY,
    name: 'Agency',
    description: 'For agencies managing multiple brands.',
    cta: 'Upgrade to Agency',
    href: '/register?plan=agency',
    featured: false,
    trialDays: null,
    features: buildFeatures(SubscriptionPlan.AGENCY),
  },
];

export function getPlanCatalogEntry(key: PlanKey): PlanCatalogEntry | undefined {
  return PLAN_CATALOG.find((p) => p.key === key);
}

export function formatPlanLimit(resource: PlanLimitResource, plan: SubscriptionPlan): string {
  const limit = PLAN_LIMITS[plan][resource];
  return formatLimit(limit, resource);
}
