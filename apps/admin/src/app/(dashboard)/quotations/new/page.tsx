'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/use-customers';
import { useCreateQuotation, useCalculatePrice } from '@/hooks/use-quotations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LineItem {
  serviceType: string;
  description: string;
  pricingType: string;
  quantity: number;
  unitPrice: number;
  area: number;
  frequency: number;
  costPerUnit: number;
  subtotal: number;
  costTotal: number;
}

const SERVICE_TYPES = [
  'General Pest Control',
  'Termite Treatment',
  'Rodent Control',
  'Mosquito Fogging',
  'Bed Bug Treatment',
  'Disinfection Service',
];

const PRICING_TYPES = ['FIXED', 'PER_SQFT', 'PER_UNIT', 'PER_VISIT', 'PACKAGE'];

export default function NewQuotationPage() {
  const router = useRouter();
  const { data: custRes } = useCustomers({ limit: 100 });
  const createQuotation = useCreateQuotation();
  const calcPrice = useCalculatePrice();

  const customers = custRes?.data ?? [];

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [logisticsFee, setLogisticsFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  const addItem = () => {
    setItems([
      ...items,
      {
        serviceType: '',
        description: '',
        pricingType: 'FIXED',
        quantity: 1,
        unitPrice: 0,
        area: 0,
        frequency: 1,
        costPerUnit: 0,
        subtotal: 0,
        costTotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    // Recalculate subtotals
    const item = updated[index];
    if (item.pricingType === 'PER_SQFT') {
      item.subtotal = item.unitPrice * item.area * item.frequency;
      item.costTotal = item.costPerUnit * item.area * item.frequency;
    } else if (item.pricingType === 'PER_UNIT') {
      item.subtotal = item.unitPrice * item.quantity * item.frequency;
      item.costTotal = item.costPerUnit * item.quantity * item.frequency;
    } else if (item.pricingType === 'PER_VISIT') {
      item.subtotal = item.unitPrice * item.frequency;
      item.costTotal = item.costPerUnit * item.frequency;
    } else {
      item.subtotal = item.unitPrice * item.quantity;
      item.costTotal = item.costPerUnit * item.quantity;
    }

    setItems(updated);
  };

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const costTotal = items.reduce((sum, i) => sum + i.costTotal, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (tax / 100);
  const finalTotal = afterDiscount + logisticsFee + taxAmount;
  const gmPercent = finalTotal > 0 ? ((finalTotal - costTotal) / finalTotal) * 100 : 0;

  const handleSubmit = async () => {
    await createQuotation.mutateAsync({
      customerId,
      items: items.map((i) => ({
        serviceType: i.serviceType,
        description: i.description,
        pricingType: i.pricingType,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        area: i.area || undefined,
        frequency: i.frequency,
        costPerUnit: i.costPerUnit,
      })),
      discountPercent,
      logisticsFee,
      tax,
      notes,
    });
    router.push('/quotations');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">New Quotation</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setCustomerId} value={customerId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.contactPerson} {c.companyName ? `(${c.companyName})` : ''} - {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No items yet. Click &quot;Add Item&quot; to start.
            </p>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Item {idx + 1}</h4>
                  <Button size="sm" variant="ghost" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Service Type</Label>
                    <Select value={item.serviceType} onValueChange={(v) => updateItem(idx, 'serviceType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pricing Type</Label>
                    <Select value={item.pricingType} onValueChange={(v) => updateItem(idx, 'pricingType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRICING_TYPES.map((p) => <SelectItem key={p} value={p}>{p.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price (RM)</Label>
                    <Input type="number" step="0.01" value={item.unitPrice || ''} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost/Unit (RM)</Label>
                    <Input type="number" step="0.01" value={item.costPerUnit || ''} onChange={(e) => updateItem(idx, 'costPerUnit', parseFloat(e.target.value) || 0)} />
                  </div>
                  {(item.pricingType === 'PER_SQFT') && (
                    <div className="space-y-1">
                      <Label className="text-xs">Area (sqft)</Label>
                      <Input type="number" value={item.area || ''} onChange={(e) => updateItem(idx, 'area', parseFloat(e.target.value) || 0)} />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <Input type="number" value={item.frequency} onChange={(e) => updateItem(idx, 'frequency', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end text-sm">
                  <span className="text-muted-foreground mr-2">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Additional Charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Discount (%)</Label>
              <Input type="number" step="0.1" value={discountPercent || ''} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Logistics Fee (RM)</Label>
              <Input type="number" step="0.01" value={logisticsFee || ''} onChange={(e) => setLogisticsFee(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Tax (%)</Label>
              <Input type="number" step="0.1" value={tax || ''} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {logisticsFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logistics</span>
                <span>{formatCurrency(logisticsFee)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({tax}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Cost Total</span>
              <span>{formatCurrency(costTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Margin</span>
              <span className={`font-bold ${gmPercent < 35 ? 'text-destructive' : 'text-green-600'}`}>
                {gmPercent.toFixed(1)}%
              </span>
            </div>
            {gmPercent < 35 && gmPercent > 0 && (
              <p className="text-xs text-destructive mt-2">
                GM is below 35%. Manager approval will be required.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!customerId || items.length === 0 || createQuotation.isPending}
        >
          Create Quotation
        </Button>
      </div>
    </div>
  );
}
