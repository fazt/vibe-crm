'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { apiClient, ApiRequestError } from '@/lib/api';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      await apiClient.post(
        '/contact',
        {
          name: data.get('name'),
          email: data.get('email'),
          company: data.get('company') || undefined,
          subject: data.get('subject'),
          message: data.get('message'),
        },
        { skipAuth: true, skipWorkspace: true },
      );

      setState('success');
      form.reset();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const fieldError = err.errors && Object.values(err.errors)[0]?.[0];
        setErrorMsg(fieldError ?? err.message);
      } else {
        setErrorMsg('Network error. Please check your connection and try again.');
      }
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="mkt-card px-8 py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff5c3820] text-[#ff5c38]">
          <Send className="h-5 w-5" />
        </div>
        <h3 className="mkt-display text-xl font-semibold text-[#f4f0e8]">Message sent</h3>
        <p className="mt-2 text-sm text-[#8b8f9a]">
          Thanks for reaching out. We&apos;ll get back to you within one business day.
        </p>
        <button type="button" className="mkt-btn-ghost mt-6 text-sm" onClick={() => setState('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mkt-card space-y-5 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mkt-label mb-2 block">
            Name
          </label>
          <input id="name" name="name" type="text" required className="mkt-input" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="mkt-label mb-2 block">
            Email
          </label>
          <input id="email" name="email" type="email" required className="mkt-input" placeholder="you@company.com" />
        </div>
      </div>

      <div>
        <label htmlFor="company" className="mkt-label mb-2 block">
          Company <span className="normal-case tracking-normal text-[#8b8f9a]/60">(optional)</span>
        </label>
        <input id="company" name="company" type="text" className="mkt-input" placeholder="Your company" />
      </div>

      <div>
        <label htmlFor="subject" className="mkt-label mb-2 block">
          Subject
        </label>
        <input id="subject" name="subject" type="text" required className="mkt-input" placeholder="How can we help?" />
      </div>

      <div>
        <label htmlFor="message" className="mkt-label mb-2 block">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          className="mkt-input mkt-textarea"
          placeholder="Tell us about your team, workflow, or question..."
        />
      </div>

      {state === 'error' && errorMsg && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMsg}</p>
      )}

      <button type="submit" disabled={state === 'loading'} className="mkt-btn-primary w-full disabled:opacity-60">
        {state === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send message
            <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
