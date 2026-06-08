'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { createContactSchema, type CreateContactInput } from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { DetailHeader } from '@/components/detail/detail-header';
import { FormSection, FormActions } from '@/components/forms/form-section';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function NewContactPage() {
  const router = useRouter();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');

  const form = useForm<CreateContactInput>({
    resolver: formResolver<CreateContactInput>(createContactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      isPrimary: false,
    },
  });

  useEffect(() => {
    Promise.all([
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/clients', { limit: 100 }),
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/companies', { limit: 100 }),
    ]).then(([cl, co]) => {
      setClients(cl.data);
      setCompanies(co.data);
    });
  }, []);

  const onSubmit = async (values: CreateContactInput) => {
    setError('');
    try {
      const payload = {
        ...values,
        email: values.email || undefined,
        clientId: values.clientId || undefined,
        companyId: values.companyId || undefined,
      };
      await apiClient.post('/contacts', payload);
      router.push('/contacts');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create contact');
    }
  };

  return (
    <div className="max-w-lg">
      <DetailHeader backHref="/contacts" backLabel="Contacts" title="New contact" />

      <Surface>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormSection title="Personal info">
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
                name="jobTitle"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Job title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Associations">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
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
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Company</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="Optional" />
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
              <FormField
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-[11px] font-normal text-muted-foreground">
                      Primary contact
                    </FormLabel>
                  </FormItem>
                )}
              />
            </FormSection>

            {error && <p className="text-[11px] text-destructive">{error}</p>}

            <FormActions>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/contacts">Cancel</Link>
              </Button>
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create contact'}
              </Button>
            </FormActions>
          </form>
        </Form>
      </Surface>
    </div>
  );
}
