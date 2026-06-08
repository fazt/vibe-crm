'use client';

import { useEffect, useMemo, useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { Surface } from '@/components/ui/surface';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  total,
  page,
  limit,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  loading,
  onRowClick,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting your search or filters.',
  toolbar,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [localSearch, setLocalSearch] = useState(search ?? '');

  useEffect(() => {
    setLocalSearch(search ?? '');
  }, [search]);

  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const showing = useMemo(() => {
    if (total === 0) return '0 results';
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    return `${from}–${to} of ${total}`;
  }, [page, limit, total]);

  return (
    <div className="space-y-3">
      {(onSearchChange || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-8"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <Surface padding="none" className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="studio-divider hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`studio-label ${col.className ?? ''}`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="studio-divider">
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="border-0 p-0">
                  <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className={`studio-divider transition-colors hover:bg-amber-950/20 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`text-sm ${col.className ?? ''}`}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Surface>

      {total > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono tabular-nums">{showing}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-mono tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
