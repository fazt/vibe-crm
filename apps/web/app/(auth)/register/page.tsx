'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Github } from 'lucide-react';
import { formResolver } from '@/lib/form';
import { registerSchema, type RegisterInput } from '@vibe-crm/validators';
import type { AuthUser, WorkspaceContext } from '@vibe-crm/shared';
import { apiClient, API_BASE, ApiRequestError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
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

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const [error, setError] = useState('');

  const form = useForm<RegisterInput>({
    resolver: formResolver<RegisterInput>(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      workspaceName: '',
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    setError('');
    try {
      const payload = {
        ...values,
        workspaceName: values.workspaceName || undefined,
      };
      const res = await apiClient.post<{
        user: AuthUser;
        workspace: WorkspaceContext;
        accessToken: string;
        refreshToken: string;
      }>('/auth/register', payload, { skipAuth: true, skipWorkspace: true });

      setAuth({
        user: res.user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });

      setWorkspaces([res.workspace]);
      setCurrentWorkspace(res.workspace.id);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Registration failed');
    }
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_BASE}/auth/github`;
  };

  return (
    <AuthShell
      title="Create account"
      description="Start managing your pipeline with Vibe CRM"
      footer={
        <AuthFooter>
          <span />
          <span>
            Already have an account?{' '}
            <Link href="/login" className="text-foreground hover:underline">
              Sign in
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
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelClass}>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelClass}>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClass}>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workspaceName"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClass}>Workspace name</FormLabel>
                <FormControl>
                  <Input placeholder="My Company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Create account'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
