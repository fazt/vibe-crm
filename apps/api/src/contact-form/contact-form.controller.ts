import { Body, Controller, Post } from '@nestjs/common';
import { contactFormSchema, type ContactFormInput } from '@vibe-crm/validators';
import { Public, SkipWorkspace } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import { ContactFormService } from './contact-form.service';

@Controller('contact')
@SkipWorkspace()
export class ContactFormController {
  constructor(private contactForm: ContactFormService) {}

  @Public()
  @Post()
  submit(@Body(new ZodValidationPipe(contactFormSchema)) body: ContactFormInput) {
    return this.contactForm.submit(body);
  }
}
