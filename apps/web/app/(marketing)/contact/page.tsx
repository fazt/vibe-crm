import type { Metadata } from 'next';
import { Mail, MessageSquare, Clock } from 'lucide-react';
import { ContactForm } from '@/components/marketing/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Vibe CRM team. We respond within one business day.',
};

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    detail: 'hello@vibecrm.com',
    hint: 'For general inquiries and support',
  },
  {
    icon: Clock,
    title: 'Response time',
    detail: 'Within 24 hours',
    hint: 'Monday through Friday',
  },
  {
    icon: MessageSquare,
    title: 'Sales & demos',
    detail: 'Agency plan onboarding',
    hint: 'Custom setups for larger teams',
  },
];

export default function ContactPage() {
  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="mkt-label mb-4">Contact</p>
            <h1 className="mkt-display text-4xl font-semibold tracking-tight text-[#f4f0e8] md:text-5xl">
              Let&apos;s talk about your pipeline
            </h1>
            <p className="mt-4 max-w-md text-[#8b8f9a]">
              Questions about plans, onboarding, or a feature you need? Send a message — a real human reads every one.
            </p>

            <div className="mt-12 space-y-6">
              {contactInfo.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#ff5c3825] bg-[#ff5c3810] text-[#ff5c38]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="mkt-label mb-1">{item.title}</p>
                    <p className="text-sm font-medium text-[#f4f0e8]">{item.detail}</p>
                    <p className="mt-0.5 text-xs text-[#8b8f9a]">{item.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
