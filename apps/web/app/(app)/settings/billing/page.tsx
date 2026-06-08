'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CreditCard } from 'lucide-react';
import type { PlanUsage } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { fetchCurrentUser } from '@/stores/auth-store';
import { PageHeader } from '@/components/page-header';
import { Surface, SurfaceHeader } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubscriptionInfo {
  plan: string;
  status: string;
  isSubscriber: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
}

const billingRequest = { skipWorkspace: true as const };

function handleBillingError(err: unknown, router: ReturnType<typeof useRouter>) {
  if (err instanceof ApiRequestError && err.statusCode === 401) {
    router.replace('/login?redirect=/settings/billing');
    return 'Session expired. Redirecting to sign in…';
  }
  return err instanceof ApiRequestError ? err.message : 'Request failed';
}

export default function BillingSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSubscriber, plan, usage, planLimits } = usePermissions();
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const loadSubscription = async () => {
    try {
      const data = await apiClient.get<SubscriptionInfo>(
        '/billing/subscription',
        undefined,
        billingRequest,
      );
      setSub(data);
      setError('');
    } catch (err) {
      setSub(null);
      setError(handleBillingError(err, router));
    }
  };

  useEffect(() => {
    void loadSubscription();
  }, []);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      void (async () => {
        await fetchCurrentUser();
        await loadSubscription();
      })();
    }
  }, [searchParams]);

  const startCheckout = async (planKey: 'studio' | 'agency') => {
    setError('');
    setLoading(planKey);
    try {
      const res = await apiClient.post<{ url: string }>(
        '/billing/checkout',
        { plan: planKey, interval: 'month' },
        billingRequest,
      );
      window.location.href = res.url;
    } catch (err) {
      setError(handleBillingError(err, router) || 'Checkout failed');
      setLoading('');
    }
  };

  const openPortal = async () => {
    setError('');
    setLoading('portal');
    try {
      const res = await apiClient.post<{ url: string }>('/billing/portal', {}, billingRequest);
      window.location.href = res.url;
    } catch (err) {
      setError(handleBillingError(err, router) || 'Portal unavailable');
      setLoading('');
    }
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
    await loadSubscription();
  };

  return (
    <div className="max-w-lg space-y-4">
      <PageHeader title="Billing" description="Manage your subscription and plan limits" label="Settings" />

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Current plan</h2>
        </SurfaceHeader>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {sub?.plan?.toLowerCase() ?? plan?.toLowerCase() ?? 'solo'}
            </Badge>
            {isSubscriber && (
              <Badge className="bg-emerald-600/20 text-emerald-300">Active subscriber</Badge>
            )}
          </div>
          {sub?.status && (
            <p className="text-xs text-muted-foreground">Status: {sub.status.toLowerCase()}</p>
          )}
          {sub?.trialEndsAt && (
            <p className="text-xs text-muted-foreground">
              Trial ends: {new Date(sub.trialEndsAt).toLocaleDateString()}
            </p>
          )}
          {sub?.currentPeriodEnd && (
            <p className="text-xs text-muted-foreground">
              Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              {sub.cancelAtPeriodEnd ? ' (cancels at period end)' : ''}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={() => void refreshProfile()}>
            Refresh status
          </Button>
        </div>
      </Surface>

      {usage && planLimits && (
        <Surface padding="none">
          <SurfaceHeader>
            <h2 className="text-sm font-medium">Usage</h2>
          </SurfaceHeader>
          <div className="grid gap-2 p-5 text-xs">
            {Object.entries(planLimits).map(([key, limit]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span>
                  {usage[key as keyof PlanUsage] ?? 0}
                  {limit != null ? ` / ${limit}` : ' / ∞'}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      )}

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Upgrade</h2>
        </SurfaceHeader>
        <div className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">
            Studio unlocks file uploads, team invites, and higher limits. Agency removes workspace caps.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!!loading}
              onClick={() => void startCheckout('studio')}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              {loading === 'studio' ? 'Redirecting…' : 'Upgrade to Studio'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!!loading}
              onClick={() => void startCheckout('agency')}
            >
              {loading === 'agency' ? 'Redirecting…' : 'Upgrade to Agency'}
            </Button>
          </div>
          {isSubscriber && (
            <Button size="sm" variant="ghost" disabled={loading === 'portal'} onClick={() => void openPortal()}>
              Manage subscription
            </Button>
          )}
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      </Surface>

      <Link href="/pricing" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        Compare plans
        <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </div>
  );
}
