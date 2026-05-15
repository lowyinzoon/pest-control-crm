'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export default function CustomersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: res, isLoading } = useCustomers({ page, limit: 20, search });
  const deleteCustomer = useDeleteCustomer();

  const customers = res?.data ?? [];
  const meta = res?.meta ?? { totalPages: 1 };

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'contactPerson', header: 'Contact Person' },
    { accessorKey: 'companyName', header: 'Company', cell: ({ row }) => row.original.companyName || '-' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'propertyType', header: 'Type', cell: ({ row }) => (
      <Badge variant="secondary">{row.original.propertyType}</Badge>
    )},
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => (
      <Badge variant={row.original.status === 'ACTIVE' ? 'default' : 'secondary'}>
        {row.original.status}
      </Badge>
    )},
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/customers/${row.original.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search customers..."
        />
      )}

      <CustomerFormDialog open={showCreate} onOpenChange={setShowCreate} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={() => {
          if (deleteId) deleteCustomer.mutate(deleteId);
        }}
        loading={deleteCustomer.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
