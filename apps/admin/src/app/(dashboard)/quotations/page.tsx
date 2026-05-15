'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { useQuotations } from '@/hooks/use-quotations';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'default',
  APPROVED: 'default',
  SENT: 'default',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'secondary',
};

export default function QuotationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data: res, isLoading } = useQuotations({ page, limit: 20, search });

  const quotations = res?.data ?? [];
  const meta = res?.meta ?? { totalPages: 1 };

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'code', header: 'Code' },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.customer?.contactPerson || '-',
    },
    {
      accessorKey: 'finalTotal',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.finalTotal),
    },
    {
      accessorKey: 'gmPercent',
      header: 'GM%',
      cell: ({ row }) => {
        const gm = row.original.gmPercent;
        return (
          <span className={gm < 35 ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
            {gm.toFixed(1)}%
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusColors[row.original.status] as any || 'secondary'}>
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      cell: ({ row }) => row.original._count?.items ?? 0,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => router.push(`/quotations/${row.original.id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotations</h1>
        <Button onClick={() => router.push('/quotations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Quotation
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={quotations}
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search quotations..."
        />
      )}
    </div>
  );
}
