'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateJob } from '@/hooks/use-jobs';
import { useCustomers } from '@/hooks/use-customers';
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
  customerId: z.string().min(1, 'Required'),
  scheduledDate: z.string().min(1, 'Required'),
  scheduledEndDate: z.string().optional(),
  serviceType: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'EMERGENCY']).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobFormDialog({ open, onOpenChange }: Props) {
  const createJob = useCreateJob();
  const { data: custRes } = useCustomers({ limit: 100 });
  const customers = custRes?.data ?? [];

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'NORMAL' },
  });

  const onSubmit = async (data: FormData) => {
    await createJob.mutateAsync(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Customer *</Label>
            <Select onValueChange={(v) => setValue('customerId', v)}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.contactPerson} {c.companyName ? `(${c.companyName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Scheduled Date *</Label>
              <Input type="datetime-local" {...register('scheduledDate')} />
              {errors.scheduledDate && <p className="text-xs text-destructive">{errors.scheduledDate.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input type="datetime-local" {...register('scheduledEndDate')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Service Type</Label>
              <Select onValueChange={(v) => setValue('serviceType', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Pest Control">General Pest Control</SelectItem>
                  <SelectItem value="Termite Treatment">Termite Treatment</SelectItem>
                  <SelectItem value="Rodent Control">Rodent Control</SelectItem>
                  <SelectItem value="Mosquito Fogging">Mosquito Fogging</SelectItem>
                  <SelectItem value="Bed Bug Treatment">Bed Bug Treatment</SelectItem>
                  <SelectItem value="Disinfection Service">Disinfection Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select defaultValue="NORMAL" onValueChange={(v) => setValue('priority', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input {...register('address')} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register('description')} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createJob.isPending}>Create Job</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
