export function welcomeEmail(name: string, workspaceName: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b">
      <h1 style="font-size:24px;margin-bottom:8px">Welcome to Vibe CRM</h1>
      <p>Hi ${name}, your workspace <strong>${workspaceName}</strong> is ready.</p>
      <p style="color:#71717a">Start managing clients, opportunities, and tasks in one place.</p>
    </div>`;
}

export function passwordResetEmail(name: string, resetUrl: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b">
      <h1 style="font-size:24px;margin-bottom:8px">Reset your password</h1>
      <p>Hi ${name}, click below to reset your password. Link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px">Reset password</a>
    </div>`;
}

export function reminderDueEmail(title: string, message: string, dueAt: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b">
      <h1 style="font-size:20px">Reminder: ${title}</h1>
      <p>${message ?? ''}</p>
      <p style="color:#71717a">Due: ${dueAt}</p>
    </div>`;
}

export function taskOverdueDigestEmail(
  name: string,
  tasks: { title: string; dueDate: string }[],
): string {
  const items = tasks
    .map((t) => `<li>${t.title} — due ${t.dueDate}</li>`)
    .join('');
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b">
      <h1 style="font-size:20px">Overdue tasks</h1>
      <p>Hi ${name}, you have ${tasks.length} overdue task(s):</p>
      <ul>${items}</ul>
    </div>`;
}

export function opportunityStaleEmail(
  name: string,
  opportunities: { title: string; days: number }[],
): string {
  const items = opportunities
    .map((o) => `<li>${o.title} — ${o.days} days without activity</li>`)
    .join('');
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b">
      <h1 style="font-size:20px">Stale opportunities</h1>
      <p>Hi ${name}, these opportunities need attention:</p>
      <ul>${items}</ul>
    </div>`;
}

export function contactFormEmail(data: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}): string {
  const company = data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : '';
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b">
      <h1 style="font-size:20px;margin-bottom:16px">New contact form submission</h1>
      <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
      ${company}
      <p><strong>Subject:</strong> ${data.subject}</p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0" />
      <p style="white-space:pre-wrap;line-height:1.6">${data.message}</p>
    </div>`;
}

export function contactConfirmationEmail(name: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b">
      <h1 style="font-size:20px;margin-bottom:8px">We received your message</h1>
      <p>Hi ${name}, thanks for reaching out to Vibe CRM.</p>
      <p style="color:#71717a">We'll get back to you within one business day.</p>
    </div>`;
}
