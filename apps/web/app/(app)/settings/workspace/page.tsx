'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { createWorkspaceSchema, type CreateWorkspaceInput } from '@vibe-crm/validators';
import { apiClient, ApiRequestError } from '@/lib/api';
import { useWorkspaceStore, useCurrentWorkspace } from '@/stores/workspace-store';
import { PageHeader } from '@/components/page-header';
import { FormSection, FormActions } from '@/components/forms/form-section';
import { Surface, SurfaceHeader } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const labelClass = 'studio-label';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export default function WorkspaceSettingsPage() {
  const current = useCurrentWorkspace();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<CreateWorkspaceInput>({
    resolver: formResolver<CreateWorkspaceInput>(createWorkspaceSchema),
    defaultValues: { name: '', slug: '' },
  });

  useEffect(() => {
    if (current) {
      apiClient
        .get<Member[]>('/workspaces/members')
        .then(setMembers)
        .catch(() => setMembers([]));
    }
  }, [current]);

  const onSubmit = async (values: CreateWorkspaceInput) => {
    setError('');
    setSuccess('');
    try {
      const ws = await apiClient.post<{ id: string; name: string; slug: string }>(
        '/workspaces',
        { name: values.name, slug: values.slug || undefined },
      );
      await fetchWorkspaces();
      setCurrentWorkspace(ws.id);
      setSuccess(`Workspace "${ws.name}" created`);
      form.reset();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create workspace');
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <PageHeader title="Workspace" description="Manage workspaces and team members" label="Settings" />

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Current workspace</h2>
        </SurfaceHeader>
        <div className="space-y-4 p-5">
          {current ? (
            <div>
              <p className="font-medium">{current.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{current.slug}</p>
              <Badge variant="outline" className="mt-2 capitalize">
                {current.role.toLowerCase()}
              </Badge>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">No workspace selected</p>
          )}

          <div className="border-t studio-divider pt-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Switch workspace
            </p>
            <div className="space-y-1">
              {workspaces.map((ws) => (
                <Button
                  key={ws.id}
                  variant={ws.id === current?.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setCurrentWorkspace(ws.id)}
                >
                  {ws.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Team members</h2>
        </SurfaceHeader>
        <div className="p-5">
          {members.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No members found.</p>
          ) : (
            <ul className="divide-y studio-divider">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(m.user.firstName, m.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {m.user.firstName} {m.user.lastName}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{m.user.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {m.role.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Surface>

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Create workspace</h2>
        </SurfaceHeader>
        <div className="p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormSection>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelClass}>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelClass}>Slug (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="my-workspace" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
              {error && <p className="text-[11px] text-destructive">{error}</p>}
              {success && <p className="text-[11px] text-emerald-500/80">{success}</p>}
              <FormActions className="border-0 pt-0">
                <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                  Create workspace
                </Button>
              </FormActions>
            </form>
          </Form>
        </div>
      </Surface>
    </div>
  );
}
