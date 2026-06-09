'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import {
  createNoteSchema,
  updateNoteSchema,
  type CreateNoteInput,
} from '@vibe-crm/validators';
import { PERMISSIONS } from '@vibe-crm/shared';
import { z } from 'zod';
import { apiClient, ApiRequestError } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

type NoteFormInput = z.infer<typeof createNoteSchema>;

interface NoteDialogProps {
  noteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  defaultClientId?: string;
  defaultOpportunityId?: string;
  defaultContactId?: string;
}

const labelClass = 'studio-label';

export function NoteDialog({
  noteId,
  open,
  onOpenChange,
  onSaved,
  defaultClientId,
  defaultOpportunityId,
  defaultContactId,
}: NoteDialogProps) {
  const isCreate = !noteId;
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canUpdate = can(PERMISSIONS.NOTES_UPDATE);
  const canDelete = can(PERMISSIONS.NOTES_DELETE);
  const canCreate = can(PERMISSIONS.NOTES_CREATE);

  const form = useForm<NoteFormInput>({
    resolver: formResolver<NoteFormInput>(isCreate ? createNoteSchema : updateNoteSchema),
    defaultValues: {
      title: '',
      content: '',
      clientId: defaultClientId,
      opportunityId: defaultOpportunityId,
      contactId: defaultContactId,
    },
  });

  const loadNote = useCallback(async () => {
    if (!noteId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<NoteFormInput & { id: string }>(`/notes/${noteId}`);
      form.reset({
        title: data.title ?? '',
        content: data.content,
        clientId: data.clientId ?? undefined,
        opportunityId: data.opportunityId ?? undefined,
        contactId: data.contactId ?? undefined,
      });
    } catch {
      setError('Failed to load note');
    } finally {
      setLoading(false);
    }
  }, [noteId, form]);

  useEffect(() => {
    if (!open) return;
    if (noteId) void loadNote();
    else {
      form.reset({
        title: '',
        content: '',
        clientId: defaultClientId,
        opportunityId: defaultOpportunityId,
        contactId: defaultContactId,
      });
      setError('');
    }
  }, [open, noteId, loadNote, form, defaultClientId, defaultOpportunityId, defaultContactId]);

  const onSubmit = async (values: NoteFormInput) => {
    setError('');
    try {
      const payload = {
        ...values,
        title: values.title || undefined,
        clientId: values.clientId || undefined,
        opportunityId: values.opportunityId || undefined,
        contactId: values.contactId || undefined,
      };
      if (isCreate) {
        if (!canCreate) return;
        await apiClient.post('/notes', payload);
      } else if (noteId) {
        if (!canUpdate) return;
        await apiClient.patch(`/notes/${noteId}`, payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!noteId || !canDelete) return;
    if (!confirm('Delete this note?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/notes/${noteId}`);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const readOnly = !isCreate && !canUpdate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'New note' : loading ? 'Loading...' : 'Note'}</DialogTitle>
        </DialogHeader>
        {loading && !isCreate ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Title</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Content</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-between gap-2">
                {!isCreate && canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    Delete
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  {(isCreate ? canCreate : canUpdate) && (
                    <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                      {isCreate ? 'Create' : 'Save'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
