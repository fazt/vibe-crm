'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { PERMISSIONS } from '@vibe-crm/shared';
import { usePermissions } from '@/hooks/use-permissions';
import { EditCompanyDialog } from '@/components/companies/edit-company-dialog';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { DetailHeader } from '@/components/detail/detail-header';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface CompanyDetail {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  createdAt: string;
}

function MetaField({ label, value, className }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="studio-label">{label}</p>
      <p className="mt-1 text-sm">{value ?? '—'}</p>
    </div>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { can } = usePermissions();
  const id = params.id as string;
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      apiClient.get<CompanyDetail>(`/companies/${id}`),
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/clients', { companyId: id, limit: 20 }),
    ])
      .then(([c, cl]) => {
        setCompany(c);
        setClients(cl.data);
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Company not found</p>
        <Button asChild variant="link" size="sm">
          <Link href="/companies">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <DetailHeader
        backHref="/companies"
        backLabel="Companies"
        title={company.name}
        description={company.domain ?? undefined}
        actions={
          (can(PERMISSIONS.COMPANIES_UPDATE) || can(PERMISSIONS.COMPANIES_DELETE)) ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          ) : undefined
        }
      />

      <EditCompanyDialog
        companyId={id}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={load}
        onDeleted={() => router.push('/companies')}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <div className="grid gap-5 sm:grid-cols-2">
            <MetaField label="Industry" value={company.industry} />
            <MetaField label="Size" value={company.size} />
            <MetaField label="Phone" value={company.phone} />
            <MetaField label="Website" value={company.website} />
            <MetaField label="Address" value={company.address} className="sm:col-span-2" />
            <div>
              <p className="studio-label">Created</p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatDate(company.createdAt)}
              </p>
            </div>
            {company.description && (
              <div className="sm:col-span-2">
                <MetaField label="Description" value={company.description} />
              </div>
            )}
          </div>
        </Surface>

        <Surface>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Linked clients
          </p>
          {clients.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No clients linked.</p>
          ) : (
            <ul className="divide-y studio-divider">
              {clients.map((c) => (
                <li key={c.id} className="py-2 first:pt-0 last:pb-0">
                  <Link href={`/clients/${c.id}`} className="text-sm hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}
