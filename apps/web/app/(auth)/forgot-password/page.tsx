'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { forgotPasswordSchema } from '@vibe-crm/validators';
import { z } from 'zod';
import { apiClient, ApiRequestError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell, AuthFooter } from '@/components/auth/auth-shell';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

const labelClass = 'studio-label';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<ForgotInput>({
    resolver: formResolver<ForgotInput>(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotInput) => {
    setError('');
    try {
      await apiClient.post('/auth/forgot-password', values, { skipAuth: true, skipWorkspace: true });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Request failed');
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        description="If an account exists for that email, we sent a password reset link."
        footer={
          <AuthFooter>
            <Link href="/login" className="hover:text-foreground">
              Back to sign in
            </Link>
            <span />
          </AuthFooter>
        }
      />
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email to receive a reset link"
      footer={
        <AuthFooter>
          <Link href="/login" className="hover:text-foreground">
            Back to sign in
          </Link>
          <span />
        </AuthFooter>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClass}>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
