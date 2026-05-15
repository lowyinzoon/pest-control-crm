'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotation, useSubmitQuotation, useApproveQuotation, useRejectQuotation } from '@/hooks/use-quotations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: res, isLoading } = useQuotation(id);
  const submitQuotation = useSubmitQuotation();
  const approveQuotation = useApproveQuotation();
  const rejectQuotation = useRejectQuotation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const q = res?.data ?? res;
  if (!q) return <p>Quotation not found</p>;

  const canApprove = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? '');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{q.code}</h1>
          <p className="text-sm text-muted-foreground">
            {q.customer?.contactPerson} {q.customer?.companyName ? `- ${q.customer.companyName}` : ''}
          </p>
        </div>
        <Badge className="ml-auto">{q.status.replace('_', ' ')}</Badge>
      </div>

      <div className="flex gap-2">
        {q.status === 'DRAFT' && (
          <Button size="sm" onClick={() => submitQuotation.mutate(id)}>
            <Send className="h-4 w-4 mr-1" />
            Submit for Approval
          </Button>
        )}
        {q.status === 'PENDING_APPROVAL' && canApprove && (
          <>
            <Button size="sm" onClick={() => approveQuotation.mutate(id)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => rejectQuotation.mutate({ id, reason: 'Rejected' })}>
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.serviceType}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  </TableCell>
                  <TableCell>{item.pricingType.replace('_', ' ')}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2 text-sm max-w-sm ml-auto">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(q.subtotal)}</span>
          </div>
          {q.discount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Discount ({q.discountPercent}%)</span>
              <span>-{formatCurrency(q.discount)}</span>
            </div>
          )}
          {q.logisticsFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Logistics</span>
              <span>{formatCurrency(q.logisticsFee)}</span>
            </div>
          )}
          {q.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(q.tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-bold text-base">
            <span>Total</span>
            <span>{formatCurrency(q.finalTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross Margin</span>
            <span className={`font-bold ${q.gmPercent < 35 ? 'text-destructive' : 'text-green-600'}`}>
              {q.gmPercent.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created By</p>
            <p>{q.createdBy?.fullName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p>{formatDate(q.createdAt)}</p>
          </div>
          {q.approvedBy && (
            <div>
              <p className="text-muted-foreground">Approved By</p>
              <p>{q.approvedBy.fullName}</p>
            </div>
          )}
          {q.validUntil && (
            <div>
              <p className="text-muted-foreground">Valid Until</p>
              <p>{formatDate(q.validUntil)}</p>
            </div>
          )}
          {q.notes && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Notes</p>
              <p>{q.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
