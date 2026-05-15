'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useJob, useUpdateJobStatus } from '@/hooks/use-jobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Phone, User, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const nextStatus: Record<string, { label: string; status: string }[]> = {
  SCHEDULED: [
    { label: 'Start Route', status: 'EN_ROUTE' },
    { label: 'Cancel', status: 'CANCELLED' },
  ],
  EN_ROUTE: [
    { label: 'Start Work', status: 'IN_PROGRESS' },
  ],
  IN_PROGRESS: [
    { label: 'Complete', status: 'COMPLETED' },
  ],
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: res, isLoading } = useJob(id);
  const updateStatus = useUpdateJobStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const job = res?.data ?? res;
  if (!job) return <p>Job not found</p>;

  const actions = nextStatus[job.status] ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{job.code}</h1>
          <p className="text-sm text-muted-foreground">{job.serviceType}</p>
        </div>
        <Badge className="ml-auto">{job.status.replace('_', ' ')}</Badge>
      </div>

      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((a) => (
            <Button
              key={a.status}
              size="sm"
              variant={a.status === 'CANCELLED' ? 'destructive' : 'default'}
              onClick={() => updateStatus.mutate({ id, status: a.status })}
              disabled={updateStatus.isPending}
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{job.customer?.contactPerson}</span>
            </div>
            {job.customer?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{job.customer.phone}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{job.address || job.customer?.address}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(job.scheduledDate)}</span>
            </div>
            <div>
              <p className="text-muted-foreground">Technician</p>
              <p>{job.technician?.fullName || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority</p>
              <Badge variant={job.priority === 'EMERGENCY' ? 'destructive' : 'secondary'}>{job.priority}</Badge>
            </div>
            {job.quotation && (
              <div>
                <p className="text-muted-foreground">Quotation</p>
                <p>{job.quotation.code}</p>
              </div>
            )}
            {job.description && (
              <div>
                <p className="text-muted-foreground">Description</p>
                <p>{job.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {job.serviceReport && (
        <Card>
          <CardHeader>
            <CardTitle>Service Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {job.serviceReport.findings && (
              <div>
                <p className="text-muted-foreground">Findings</p>
                <p>{job.serviceReport.findings}</p>
              </div>
            )}
            {job.serviceReport.recommendations && (
              <div>
                <p className="text-muted-foreground">Recommendations</p>
                <p>{job.serviceReport.recommendations}</p>
              </div>
            )}
            {job.serviceReport.chemicalsUsed && (
              <div>
                <p className="text-muted-foreground">Chemicals Used</p>
                <p>{job.serviceReport.chemicalsUsed}</p>
              </div>
            )}
            {job.serviceReport.completedAt && (
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p>{formatDateTime(job.serviceReport.completedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
