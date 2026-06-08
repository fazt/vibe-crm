'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, fetchCurrentUser } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { AuthShell } from '@/components/auth/auth-shell';

function GithubCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setTokens = useAuthStore((s) => s.setTokens);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const err = searchParams.get('error');

    if (err) {
      setError('GitHub sign-in failed. Please try again.');
      setTimeout(() => router.replace('/login'), 2000);
      return;
    }

    if (!accessToken || !refreshToken) {
      setError('Invalid GitHub callback.');
      setTimeout(() => router.replace('/login'), 2000);
      return;
    }

    (async () => {
      try {
        setTokens(accessToken, refreshToken);
        const user = await fetchCurrentUser();
        if (user) setAuth({ user, accessToken, refreshToken });
        await fetchWorkspaces();
        router.replace('/dashboard');
      } catch {
        setError('Could not complete GitHub sign-in.');
        setTimeout(() => router.replace('/login'), 2000);
      }
    })();
  }, [searchParams, setAuth, fetchWorkspaces, router]);

  return (
    <AuthShell
      title={error ? 'Sign-in failed' : 'Signing in with GitHub'}
      description={error || 'Completing authentication...'}
    >
      {!error && (
        <div className="flex justify-center py-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-950/40 border-t-amber-400" />
        </div>
      )}
    </AuthShell>
  );
}

export default function GithubCallbackPage() {
  return (
    <Suspense>
      <GithubCallbackHandler />
    </Suspense>
  );
}
