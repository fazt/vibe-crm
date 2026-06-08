import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';

interface WebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private billing: BillingService,
  ) {}

  async handleEvent(event: WebhookEvent) {
    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    });
    if (existing) return;

    await this.prisma.stripeWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          metadata?: { userId?: string };
          client_reference_id?: string;
          customer?: string;
        };
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (userId && session.customer) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: String(session.customer) },
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Parameters<BillingService['syncSubscriptionFromStripe']>[0];
        await this.billing.syncSubscriptionFromStripe(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Parameters<BillingService['handleSubscriptionDeleted']>[0];
        await this.billing.handleSubscriptionDeleted(sub);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as { subscription?: string };
        const subId = invoice.subscription;
        if (!subId) break;
        const userSub = await this.prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (userSub) {
          await this.prisma.subscription.update({
            where: { userId: userSub.userId },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }
}
