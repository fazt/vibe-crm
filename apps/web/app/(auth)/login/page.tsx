'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Github } from 'lucide-react';
import { formResolver } from '@/lib/form';
import { loginSchema, type LoginInput } from '@vibe-crm/validators';
import { apiClient, API_BASE, ApiRequestError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { fetchCurrentUser } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell, AuthDivider, AuthFooter } from '@/components/auth/auth-shell';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const labelClass = 'studio-label';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const [error, setError] = useState('');

  const oauthError = searchParams.get('error');
  const displayError =
    error ||
    (oauthError === 'github_not_configured'
      ? 'GitHub sign-in is not configured yet.'
      : oauthError
        ? 'GitHub sign-in failed. Please try again.'
        : '');

  const form = useForm<LoginInput>({
    resolver: formResolver<LoginInput>(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setError('');
    try {
      const res = await apiClient.post<{
        user: { id: string; email: string; firstName: string; lastName: string; avatarUrl?: string };
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', values, { skipAuth: true, skipWorkspace: true });

      setAuth({
        user: res.user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });

      await fetchCurrentUser();
      const workspaces = await fetchWorkspaces();
      if (workspaces.length === 0) setWorkspaces([]);

      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Login failed');
    }
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_BASE}/auth/github`;
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your Vibe CRM account"
      footer={
        <AuthFooter>
          <Link href="/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
          <span>
            No account?{' '}
            <Link href="/register" className="text-foreground hover:underline">
              Create one
            </Link>
          </span>
        </AuthFooter>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGithubLogin}
      >
        <Github className="h-4 w-4" />
        Continue with GitHub
      </Button>

      <AuthDivider />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClass}>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClass}>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {displayError && <p className="text-[11px] text-destructive">{displayError}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
