'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { useJobs } from '@/hooks/use-jobs';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Calendar as CalendarIcon, List } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { JobFormDialog } from '@/components/jobs/job-form-dialog';

const statusColors: Record<string, string> = {
  SCHEDULED: 'secondary',
  EN_ROUTE: 'default',
  IN_PROGRESS: 'default',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
  RESCHEDULED: 'secondary',
};

const priorityColors: Record<string, string> = {
  LOW: 'secondary',
  NORMAL: 'default',
  HIGH: 'default',
  EMERGENCY: 'destructive',
};

export default function JobsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showCreate, setShowCreate] = useState(false);
  const { data: res, isLoading } = useJobs({ page, limit: 20, search });

  const jobs = res?.data ?? [];
  const meta = res?.meta ?? { totalPages: 1 };

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'code', header: 'Code' },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer?.contactPerson}</p>
          <p className="text-xs text-muted-foreground">{row.original.customer?.address}</p>
        </div>
      ),
    },
    {
      id: 'technician',
      header: 'Technician',
      cell: ({ row }) => row.original.technician?.fullName || 'Unassigned',
    },
    {
      accessorKey: 'scheduledDate',
      header: 'Scheduled',
      cell: ({ row }) => formatDateTime(row.original.scheduledDate),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={priorityColors[row.original.priority] as any || 'secondary'}>
          {row.original.priority}
        </Badge>
      ),
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
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => router.push(`/jobs/${row.original.id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // Simple calendar view with grouped dates
  const jobsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    jobs.forEach((job: any) => {
      const date = formatDate(job.scheduledDate);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(job);
    });
    return grouped;
  }, [jobs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="calendar"><CalendarIcon className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : view === 'list' ? (
        <DataTable
          columns={columns}
          data={jobs}
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search jobs..."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(jobsByDate).map(([date, dateJobs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium mb-2">{date}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dateJobs.map((job: any) => (
                  <Card
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono">{job.code}</span>
                        <Badge variant={statusColors[job.status] as any || 'secondary'} className="text-xs">
                          {job.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{job.customer?.contactPerson}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(job.scheduledDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.technician?.fullName || 'Unassigned'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(jobsByDate).length === 0 && (
            <p className="text-center text-muted-foreground py-12">No jobs found</p>
          )}
        </div>
      )}

      <JobFormDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
