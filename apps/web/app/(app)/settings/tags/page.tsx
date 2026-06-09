'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { createTagSchema, type CreateTagInput } from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface TagRow {
  id: string;
  name: string;
  color: string;
}

export default function TagsPage() {
  const { can } = usePermissions();
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<TagRow | null>(null);
  const [error, setError] = useState('');

  const form = useForm<CreateTagInput>({
    resolver: formResolver<CreateTagInput>(createTagSchema),
    defaultValues: { name: '', color: '#6366f1' },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<TagRow>>('/tags', { limit: 100 });
      setTags(res.data);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (editTag) {
      form.reset({ name: editTag.name, color: editTag.color });
    } else {
      form.reset({ name: '', color: '#6366f1' });
    }
  }, [editTag, form]);

  const onSubmit = async (values: CreateTagInput) => {
    setError('');
    try {
      if (editTag) {
        await apiClient.patch(`/tags/${editTag.id}`, values);
      } else {
        await apiClient.post('/tags', values);
      }
      setCreateOpen(false);
      setEditTag(null);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (tag: TagRow) => {
    if (!can(PERMISSIONS.TAGS_DELETE)) return;
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    await apiClient.delete(`/tags/${tag.id}`);
    load();
  };

  const dialogOpen = createOpen || !!editTag;

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Organize records with colored labels"
        actions={
          can(PERMISSIONS.TAGS_CREATE) ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New tag
            </Button>
          ) : undefined
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : tags.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No tags yet.</p>
      ) : (
        <Surface padding="none" className="divide-y studio-divider">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Badge variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
              <div className="flex gap-2">
                {can(PERMISSIONS.TAGS_UPDATE) && (
                  <Button variant="ghost" size="sm" onClick={() => setEditTag(tag)}>
                    Edit
                  </Button>
                )}
                {can(PERMISSIONS.TAGS_DELETE) && (
                  <Button variant="ghost" size="sm" onClick={() => void handleDelete(tag)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Surface>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditTag(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTag ? 'Edit tag' : 'New tag'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="studio-label">Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="studio-label">Color</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} className="h-10 w-20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateOpen(false);
                    setEditTag(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editTag ? 'Save' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
