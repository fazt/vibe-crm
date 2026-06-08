import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@vibe-crm/database';
import Stripe from 'stripe';
import { PLAN_CATALOG, PLAN_LIMITS, PlatformRoleSlug } from '@vibe-crm/shared';
import type { CheckoutInput } from '@vibe-crm/validators';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
];

@Injectable()
export class BillingService {
  // Stripe v22 default export typing is incompatible with our TS config
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private prisma: PrismaService,
    private rbac: RbacService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) this.stripe = new Stripe(key);
  }

  private requireStripe() {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    return this.stripe;
  }

  resolvePriceId(input: CheckoutInput): string {
    const map: Record<string, string | undefined> = {
      'studio-month': process.env.STRIPE_PRICE_STUDIO_MONTHLY,
      'studio-year': process.env.STRIPE_PRICE_STUDIO_YEARLY,
      'agency-month': process.env.STRIPE_PRICE_AGENCY_MONTHLY,
      'agency-year': process.env.STRIPE_PRICE_AGENCY_YEARLY,
    };

    if (input.priceId) return input.priceId;

    const plan = input.plan ?? 'studio';
    const key = `${plan}-${input.interval}`;
    const priceId = map[key];
    if (!priceId) {
      throw new BadRequestException(`Price not configured for ${key}`);
    }
    return priceId;
  }

  async getOrCreateCustomer(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { subscription: true },
    });

    if (user.stripeCustomerId) return user.stripeCustomerId;

    const stripe = this.requireStripe();
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    if (!user.subscription) {
      await this.prisma.subscription.create({
        data: { userId, stripeCustomerId: customer.id },
      });
    } else {
      await this.prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId: customer.id },
      });
    }

    return customer.id;
  }

  async createCheckout(userId: string, input: CheckoutInput) {
    const stripe = this.requireStripe();
    const priceId = this.resolvePriceId(input);
    const customerId = await this.getOrCreateCustomer(userId);
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';

    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    const trialDays =
      !sub?.hadTrial && (input.plan ?? 'studio') === 'studio'
        ? Number(process.env.STRIPE_TRIAL_DAYS ?? 14)
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: userId,
      metadata: { userId },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${webUrl}/settings/billing?success=1`,
      cancel_url: `${webUrl}/pricing?canceled=1`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId },
        ...(trialDays ? { trial_period_days: trialDays } : {}),
      },
    });

    if (!session.url) throw new BadRequestException('Failed to create checkout session');
    return { url: session.url };
  }

  async createPortal(userId: string) {
    const stripe = this.requireStripe();
    const customerId = await this.getOrCreateCustomer(userId);
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${webUrl}/settings/billing`,
    });

    return { url: session.url };
  }

  private async retrieveStripePrice(priceId: string | undefined) {
    if (!priceId || !this.stripe) return null;
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return {
        amount: price.unit_amount,
        currency: price.currency,
        priceId: price.id,
        interval: price.recurring?.interval ?? 'month',
      };
    } catch {
      return null;
    }
  }

  async getPlans() {
    const configured = Boolean(this.stripe);
    const trialDays = Number(process.env.STRIPE_TRIAL_DAYS ?? 14);

    const priceMap = {
      studioMonth: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
      studioYear: process.env.STRIPE_PRICE_STUDIO_YEARLY,
      agencyMonth: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
      agencyYear: process.env.STRIPE_PRICE_AGENCY_YEARLY,
    };

    const [studioMonth, studioYear, agencyMonth, agencyYear] = await Promise.all([
      this.retrieveStripePrice(priceMap.studioMonth),
      this.retrieveStripePrice(priceMap.studioYear),
      this.retrieveStripePrice(priceMap.agencyMonth),
      this.retrieveStripePrice(priceMap.agencyYear),
    ]);

    const savingsPercent = (month: { amount: number | null } | null, year: { amount: number | null } | null) => {
      if (!month?.amount || !year?.amount) return null;
      const monthlyAnnual = month.amount * 12;
      if (monthlyAnnual <= year.amount) return null;
      return Math.round(((monthlyAnnual - year.amount) / monthlyAnnual) * 100);
    };

    return {
      configured,
      trialDays,
      plans: PLAN_CATALOG.map((entry) => {
        const limits = PLAN_LIMITS[entry.plan];
        let prices: Record<string, unknown> = {
          month: { amount: 0, currency: 'usd', priceId: null },
          year: { amount: 0, currency: 'usd', priceId: null, savingsPercent: null },
        };

        if (entry.key === 'studio') {
          prices = {
            month: studioMonth ?? { amount: null, currency: 'usd', priceId: priceMap.studioMonth ?? null },
            year: {
              ...(studioYear ?? { amount: null, currency: 'usd', priceId: priceMap.studioYear ?? null }),
              savingsPercent: savingsPercent(studioMonth, studioYear),
            },
          };
        } else if (entry.key === 'agency') {
          prices = {
            month: agencyMonth ?? { amount: null, currency: 'usd', priceId: priceMap.agencyMonth ?? null },
            year: {
              ...(agencyYear ?? { amount: null, currency: 'usd', priceId: priceMap.agencyYear ?? null }),
              savingsPercent: savingsPercent(agencyMonth, agencyYear),
            },
          };
        }

        return {
          key: entry.key,
          name: entry.name,
          description: entry.description,
          featured: entry.featured,
          cta: entry.cta,
          href: entry.href,
          trialDays: entry.trialDays,
          features: entry.features,
          limits,
          prices,
        };
      }),
    };
  }

  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { subscription: true, role: true },
    });

    const sub = user.subscription;
    const isSubscriber =
      user.role.slug === PlatformRoleSlug.SUBSCRIBER ||
      user.role.slug === PlatformRoleSlug.SUPERADMIN ||
      (sub != null && ACTIVE_STATUSES.includes(sub.status));

    return {
      plan: sub?.plan ?? SubscriptionPlan.SOLO,
      status: sub?.status ?? SubscriptionStatus.NONE,
      isSubscriber,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      trialEndsAt: sub?.trialEndsAt ?? null,
      hadTrial: sub?.hadTrial ?? false,
    };
  }

  planFromPriceId(priceId: string): SubscriptionPlan {
    const studioPrices = [
      process.env.STRIPE_PRICE_STUDIO_MONTHLY,
      process.env.STRIPE_PRICE_STUDIO_YEARLY,
    ].filter(Boolean);
    if (studioPrices.includes(priceId)) return SubscriptionPlan.STUDIO;
    return SubscriptionPlan.AGENCY;
  }

  mapStripeStatus(status: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      trialing: SubscriptionStatus.TRIALING,
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
      incomplete: SubscriptionStatus.NONE,
      incomplete_expired: SubscriptionStatus.CANCELED,
      paused: SubscriptionStatus.CANCELED,
    };
    return map[status] ?? SubscriptionStatus.NONE;
  }

  async syncSubscriptionFromStripe(stripeSub: {
    id: string;
    customer: string | { id: string };
    metadata: { userId?: string };
    items: { data: { price: { id: string } }[] };
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
    trial_end: number | null;
  }) {
    const userId = stripeSub.metadata.userId;
    if (!userId) return;

    const priceId = stripeSub.items.data[0]?.price.id ?? '';
    const plan = this.planFromPriceId(priceId);
    const status = this.mapStripeStatus(stripeSub.status);
    const subscriberRoleId = await this.rbac.getPlatformRoleId(PlatformRoleSlug.SUBSCRIBER);
    const userRoleId = await this.rbac.getPlatformRoleId(PlatformRoleSlug.USER);

    const isActive = ACTIVE_STATUSES.includes(status);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: String(stripeSub.customer),
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: priceId,
        plan: isActive ? plan : SubscriptionPlan.SOLO,
        status,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        hadTrial: stripeSub.status === 'trialing' || stripeSub.trial_end != null,
      },
      update: {
        stripeCustomerId: String(stripeSub.customer),
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: priceId,
        plan: isActive ? plan : SubscriptionPlan.SOLO,
        status,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        hadTrial: stripeSub.status === 'trialing' || stripeSub.trial_end != null,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: isActive ? subscriberRoleId : userRoleId },
    });
  }

  async handleSubscriptionDeleted(stripeSub: { metadata: { userId?: string } }) {
    const userId = stripeSub.metadata.userId;
    if (!userId) return;

    const userRoleId = await this.rbac.getPlatformRoleId(PlatformRoleSlug.USER);

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan: SubscriptionPlan.SOLO,
        status: SubscriptionStatus.CANCELED,
        stripeSubscriptionId: null,
        stripePriceId: null,
        cancelAtPeriodEnd: false,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: userRoleId },
    });
  }
}
