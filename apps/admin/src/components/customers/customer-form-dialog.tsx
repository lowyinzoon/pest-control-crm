'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  contactPerson: z.string().min(1, 'Contact person is required'),
  companyName: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']).optional(),
  source: z.enum(['FACEBOOK', 'GOOGLE', 'REFERRAL', 'WEBSITE', 'WALK_IN', 'COLD_CALL', 'OTHER']).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: any;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: Props) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: customer ?? {},
  });

  const onSubmit = async (data: FormData) => {
    if (customer) {
      await updateCustomer.mutateAsync({ id: customer.id, data });
    } else {
      await createCustomer.mutateAsync(data);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Contact Person *</Label>
              <Input {...register('contactPerson')} />
              {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Company Name</Label>
              <Input {...register('companyName')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Phone *</Label>
              <Input {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Address *</Label>
            <Input {...register('address')} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Property Type</Label>
              <Select onValueChange={(v) => setValue('propertyType', v as any)} defaultValue={customer?.propertyType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                  <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select onValueChange={(v) => setValue('source', v as any)} defaultValue={customer?.source}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="GOOGLE">Google</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="WALK_IN">Walk-in</SelectItem>
                  <SelectItem value="COLD_CALL">Cold Call</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
              {customer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
