'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { createClientSchema, type CreateClientInput } from '@vibe-crm/validators';
import { ClientStatus } from '@vibe-crm/shared';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { DetailHeader } from '@/components/detail/detail-header';
import { FormSection, FormActions } from '@/components/forms/form-section';
import { Surface } from '@/components/ui/surface';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const labelClass = 'studio-label';
const selectTriggerClass = 'studio-inset rounded-lg';

interface CompanyOption {
  id: string;
  name: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [error, setError] = useState('');

  const form = useForm<CreateClientInput>({
    resolver: formResolver<CreateClientInput>(createClientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: ClientStatus.PROSPECT,
      website: '',
      description: '',
    },
  });

  useEffect(() => {
    apiClient
      .get<PaginatedResponse<CompanyOption>>('/companies', { limit: 100 })
      .then((res) => setCompanies(res.data))
      .catch(() => setCompanies([]));
  }, []);

  const onSubmit = async (values: CreateClientInput) => {
    setError('');
    try {
      const payload = {
        ...values,
        email: values.email || undefined,
        website: values.website || undefined,
        companyId: values.companyId || undefined,
      };
      const client = await apiClient.post<{ id: string }>('/clients', payload);
      router.push(`/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create client');
    }
  };

  return (
    <div className="max-w-lg">
      <DetailHeader backHref="/clients" backLabel="Clients" title="New client" />

      <Surface>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormSection title="Basic info">
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
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Classification">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ClientStatus).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Company</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Notes">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} className="studio-inset rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {error && <p className="text-[11px] text-destructive">{error}</p>}

            <FormActions>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/clients">Cancel</Link>
              </Button>
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create client'}
              </Button>
            </FormActions>
          </form>
        </Form>
      </Surface>
    </div>
  );
}
