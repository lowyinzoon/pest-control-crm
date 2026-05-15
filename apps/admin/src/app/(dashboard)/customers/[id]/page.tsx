'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/hooks/use-customers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: res, isLoading } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const customer = res?.data ?? res;
  if (!customer) return <p>Customer not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{customer.contactPerson}</h1>
          <p className="text-sm text-muted-foreground">{customer.code}</p>
        </div>
        <Badge className="ml-auto" variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {customer.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {customer.companyName && (
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{customer.companyName}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{customer.address}</span>
            </div>
            <div>
              <p className="text-muted-foreground">Property Type</p>
              <Badge variant="secondary">{customer.propertyType}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Branch</p>
              <p>{customer.branch?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{formatDate(customer.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.activityLogs?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {customer.activityLogs?.map((log: any) => (
                  <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{log.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                      {log.description && (
                        <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        by {log.createdBy?.fullName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
