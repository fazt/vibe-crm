import { SubscriptionPlan } from './enums';

export type PlanLimitResource =
  | 'workspaces'
  | 'clients'
  | 'contacts'
  | 'opportunities'
  | 'tasks'
  | 'members'
  | 'documents';

export type PlanLimits = Record<PlanLimitResource, number | null>;

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  [SubscriptionPlan.SOLO]: {
    workspaces: 1,
    clients: 25,
    contacts: 50,
    opportunities: 15,
    tasks: 30,
    members: 1,
    documents: 0,
  },
  [SubscriptionPlan.STUDIO]: {
    workspaces: 3,
    clients: null,
    contacts: null,
    opportunities: null,
    tasks: null,
    members: 5,
    documents: null,
  },
  [SubscriptionPlan.AGENCY]: {
    workspaces: null,
    clients: null,
    contacts: null,
    opportunities: null,
    tasks: null,
    members: null,
    documents: null,
  },
};

export function isUnlimited(limit: number | null): boolean {
  return limit === null;
}
