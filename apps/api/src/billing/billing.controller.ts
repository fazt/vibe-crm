import { Body, Controller, Get, Post } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import { checkoutSchema } from '@vibe-crm/validators';
import { BillingService } from './billing.service';
import { CurrentUser, Public, RequirePermissions, SkipWorkspace } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';

@Controller('billing')
@SkipWorkspace()
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('plans')
  @Public()
  getPlans() {
    return this.billing.getPlans();
  }

  @Get('subscription')
  @RequirePermissions(PERMISSIONS.BILLING_MANAGE)
  getSubscription(@CurrentUser('id') userId: string) {
    return this.billing.getSubscription(userId);
  }

  @Post('checkout')
  @RequirePermissions(PERMISSIONS.BILLING_MANAGE)
  checkout(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(checkoutSchema)) body: unknown,
  ) {
    return this.billing.createCheckout(userId, body as Parameters<BillingService['createCheckout']>[1]);
  }

  @Post('portal')
  @RequirePermissions(PERMISSIONS.BILLING_MANAGE)
  portal(@CurrentUser('id') userId: string) {
    return this.billing.createPortal(userId);
  }
}
