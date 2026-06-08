import { Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { Public, SkipWorkspace } from '../common/decorators';

@Controller('webhooks')
@SkipWorkspace()
export class WebhooksController {
  @Public()
  @Post('inbound')
  inbound() {
    throw new ServiceUnavailableException('Inbound webhooks are disabled');
  }
}
