'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { updateCompanySchema, type CreateCompanyInput } from '@vibe-crm/validators';
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

type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

interface EditCompanyDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

const labelClass = 'studio-label';

export function EditCompanyDialog({
  companyId,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: EditCompanyDialogProps) {
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canUpdate = can(PERMISSIONS.COMPANIES_UPDATE);
  const canDelete = can(PERMISSIONS.COMPANIES_DELETE);

  const form = useForm<UpdateCompanyInput>({
    resolver: formResolver<UpdateCompanyInput>(updateCompanySchema),
  });

  useEffect(() => {
    if (!open || !companyId) return;
    setLoading(true);
    apiClient
      .get<CreateCompanyInput & { id: string }>(`/companies/${companyId}`)
      .then((company) => {
        form.reset({
          name: company.name,
          domain: company.domain ?? '',
          industry: company.industry ?? '',
          size: company.size ?? '',
          website: company.website ?? '',
          phone: company.phone ?? '',
          address: company.address ?? '',
          description: company.description ?? '',
        });
      })
      .catch(() => setError('Failed to load company'))
      .finally(() => setLoading(false));
  }, [open, companyId, form]);

  const onSubmit = async (values: UpdateCompanyInput) => {
    if (!canUpdate) return;
    setError('');
    try {
      await apiClient.patch(`/companies/${companyId}`, {
        ...values,
        website: values.website || undefined,
        domain: values.domain || undefined,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!confirm('Delete this company?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/companies/${companyId}`);
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (!canUpdate && !canDelete) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit company</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Domain</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Industry</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canUpdate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Size</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canUpdate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Website</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Address</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-between gap-2">
                {canDelete ? (
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
                  {canUpdate && (
                    <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                      Save
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
