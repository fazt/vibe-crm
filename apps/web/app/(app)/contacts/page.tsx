'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { CopyEmail } from '@/components/copy-email';

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  client?: { id: string; name: string } | null;
}

const columns: Column<ContactRow>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (row) => (
      <span className="font-medium">
        {row.firstName} {row.lastName}
      </span>
    ),
  },
  { key: 'email', header: 'Email', cell: (row) => (row.email ? <CopyEmail email={row.email} /> : '—') },
  { key: 'jobTitle', header: 'Title', cell: (row) => row.jobTitle ?? '—' },
  { key: 'client', header: 'Client', cell: (row) => row.client?.name ?? '—' },
];

export default function ContactsPage() {
  const [data, setData] = useState<ContactRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<ContactRow>>('/contacts', {
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
        title="Contacts"
        description="People across your clients and companies"
        actions={
          <Button asChild size="sm">
            <Link href="/contacts/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New contact
            </Link>
          </Button>
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
      />
    </div>
  );
}
