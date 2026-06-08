'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { createCompanySchema, type CreateCompanyInput } from '@vibe-crm/validators';
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

const labelClass = 'studio-label';

export default function NewCompanyPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const form = useForm<CreateCompanyInput>({
    resolver: formResolver<CreateCompanyInput>(createCompanySchema),
    defaultValues: { name: '', domain: '', industry: '', website: '', phone: '', address: '', description: '' },
  });

  const onSubmit = async (values: CreateCompanyInput) => {
    setError('');
    try {
      const payload = {
        ...values,
        website: values.website || undefined,
        domain: values.domain || undefined,
      };
      const company = await apiClient.post<{ id: string }>('/companies', payload);
      router.push(`/companies/${company.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create company');
    }
  };

  return (
    <div className="max-w-lg">
      <DetailHeader backHref="/companies" backLabel="Companies" title="New company" />

      <Surface>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormSection title="Organization">
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
                name="domain"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Industry</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelClass}>Website</FormLabel>
                    <FormControl>
                      <Input type="url" {...field} />
                    </FormControl>
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
                <Link href="/companies">Cancel</Link>
              </Button>
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create company'}
              </Button>
            </FormActions>
          </form>
        </Form>
      </Surface>
    </div>
  );
}
