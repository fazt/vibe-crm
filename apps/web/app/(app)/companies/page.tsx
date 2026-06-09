'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  website: string | null;
  createdAt: string;
}

const columns: Column<CompanyRow>[] = [
  { key: 'name', header: 'Name', cell: (row) => <span className="font-medium">{row.name}</span> },
  { key: 'domain', header: 'Domain', cell: (row) => row.domain ?? '—' },
  { key: 'industry', header: 'Industry', cell: (row) => row.industry ?? '—' },
  {
    key: 'created',
    header: 'Created',
    cell: (row) => (
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatDate(row.createdAt)}
      </span>
    ),
  },
];

export default function CompaniesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [data, setData] = useState<CompanyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<CompanyRow>>('/companies', {
        page,
        limit: 20,
        search: search || undefined,
      });
      setData(res.data);
      setTotal(res.meta.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Organizations in your workspace"
        actions={
          can(PERMISSIONS.COMPANIES_CREATE) ? (
            <Button asChild size="sm">
              <Link href="/companies/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New company
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTable
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
        onRowClick={(row) => router.push(`/companies/${row.id}`)}
      />
    </div>
  );
}
