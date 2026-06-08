import { Controller, Headers, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { Public, SkipWorkspace } from '../common/decorators';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('webhooks')
@SkipWorkspace()
export class StripeWebhookController {
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(private webhooks: StripeWebhookService) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) this.stripe = new Stripe(key);
  }

  @Public()
  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new ServiceUnavailableException('Stripe webhooks are not configured');
    }

    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      throw new ServiceUnavailableException('Invalid webhook payload');
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    await this.webhooks.handleEvent(
      event as unknown as { id: string; type: string; data: { object: Record<string, unknown> } },
    );
    return { received: true };
  }
}
