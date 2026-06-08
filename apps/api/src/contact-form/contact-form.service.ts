import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  contactConfirmationEmail,
  contactFormEmail,
  sendEmail,
} from '@vibe-crm/emails';
import type { ContactFormInput } from '@vibe-crm/validators';

@Injectable()
export class ContactFormService {
  async submit(data: ContactFormInput) {
    const contactEmail = process.env.CONTACT_EMAIL ?? 'hello@vibecrm.com';

    const sent = await sendEmail({
      to: contactEmail,
      subject: `[Vibe CRM Contact] ${data.subject}`,
      html: contactFormEmail(data),
    });

    if (!sent) {
      throw new ServiceUnavailableException(
        'Email service unavailable. Please try again later or email us directly.',
      );
    }

    await sendEmail({
      to: data.email,
      subject: 'We received your message — Vibe CRM',
      html: contactConfirmationEmail(data.name),
    });

    return { success: true };
  }
}
