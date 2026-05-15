'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLead } from '@/hooks/use-leads';
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
  contactPerson: z.string().min(1, 'Required'),
  companyName: z.string().optional(),
  phone: z.string().min(1, 'Required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']).optional(),
  source: z.enum(['FACEBOOK', 'GOOGLE', 'REFERRAL', 'WEBSITE', 'WALK_IN', 'COLD_CALL', 'OTHER']).optional(),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadFormDialog({ open, onOpenChange }: Props) {
  const createLead = useCreateLead();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await createLead.mutateAsync(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
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
            <Label>Address</Label>
            <Input {...register('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Property Type</Label>
              <Select onValueChange={(v) => setValue('propertyType', v as any)}>
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
              <Select onValueChange={(v) => setValue('source', v as any)}>
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
            <Label>Estimated Value (RM)</Label>
            <Input type="number" {...register('estimatedValue', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createLead.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
