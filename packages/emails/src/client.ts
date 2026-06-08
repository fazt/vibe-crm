import { Resend } from 'resend';

let resend: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const client = getResendClient();
  const from = process.env.EMAIL_FROM ?? 'Vibe CRM <noreply@localhost>';
  if (!client) {
    console.log('[email stub]', params.to, params.subject);
    return false;
  }
  await client.emails.send({ from, to: params.to, subject: params.subject, html: params.html });
  return true;
}
