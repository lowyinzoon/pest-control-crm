import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

export function useCustomers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const res = await apiClient.get('/customers', { params });
      return res.data;
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const res = await apiClient.get(`/customers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/customers', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer created successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create customer', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.patch(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update customer', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/customers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to delete customer', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}
