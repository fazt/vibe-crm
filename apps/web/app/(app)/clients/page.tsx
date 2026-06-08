'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { ClientStatus } from '@vibe-crm/shared';
import { PERMISSIONS } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyEmail } from '@/components/copy-email';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  company?: { id: string; name: string } | null;
}

const statusVariant: Record<ClientStatus, 'success' | 'secondary' | 'warning'> = {
  [ClientStatus.ACTIVE]: 'success',
  [ClientStatus.INACTIVE]: 'secondary',
  [ClientStatus.PROSPECT]: 'warning',
};

const columns: Column<ClientRow>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: 'email',
    header: 'Email',
    cell: (row) => (row.email ? <CopyEmail email={row.email} /> : '—'),
  },
  {
    key: 'company',
    header: 'Company',
    cell: (row) => row.company?.name ?? '—',
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={statusVariant[row.status]} className="capitalize">
        {row.status.toLowerCase()}
      </Badge>
    ),
  },
];

export default function ClientsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [data, setData] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<ClientRow>>('/clients', {
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setData(res.data);
      setTotal(res.meta.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage your client relationships"
        actions={
          can(PERMISSIONS.CLIENTS_CREATE) ? (
            <Button asChild size="sm">
              <Link href="/clients/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New client
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTable
        toolbar={
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 rounded-lg studio-inset text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value={ClientStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={ClientStatus.PROSPECT}>Prospect</SelectItem>
              <SelectItem value={ClientStatus.INACTIVE}>Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        search={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        loading={loading}
        onRowClick={(row) => router.push(`/clients/${row.id}`)}
        emptyTitle="No clients yet"
        emptyDescription="Create your first client to get started."
      />
    </div>
  );
}
