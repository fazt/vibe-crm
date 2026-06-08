'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { resetPasswordSchema } from '@vibe-crm/validators';
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

type ResetInput = z.infer<typeof resetPasswordSchema>;

const labelClass = 'studio-label';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const form = useForm<ResetInput>({
    resolver: formResolver<ResetInput>(resetPasswordSchema),
    defaultValues: { token, password: '' },
  });

  const onSubmit = async (values: ResetInput) => {
    setError('');
    try {
      await apiClient.post('/auth/reset-password', values, { skipAuth: true, skipWorkspace: true });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Reset failed');
    }
  };

  if (!token) {
    return (
      <AuthShell
        title="Invalid link"
        description="This password reset link is invalid or expired."
        footer={
          <AuthFooter>
            <Link href="/forgot-password" className="hover:text-foreground">
              Request a new link
            </Link>
            <span />
          </AuthFooter>
        }
      />
    );
  }

  if (done) {
    return (
      <AuthShell
        title="Password updated"
        description="Redirecting to sign in..."
      />
    );
  }

  return (
    <AuthShell
      title="Reset password"
      description="Enter your new password"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...form.register('token')} value={token} />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClass}>New password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Update password
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
