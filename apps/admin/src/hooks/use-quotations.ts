import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

export function useQuotations(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['quotations', params],
    queryFn: async () => {
      const res = await apiClient.get('/quotations', { params });
      return res.data;
    },
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['quotations', id],
    queryFn: async () => {
      const res = await apiClient.get(`/quotations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/quotations', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation created successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create quotation', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.patch(`/quotations/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update quotation', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useSubmitQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/quotations/${id}/submit`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation submitted for approval' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to submit quotation', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useApproveQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/quotations/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation approved' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to approve quotation', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useRejectQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.post(`/quotations/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation rejected' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to reject quotation', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useCalculatePrice() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/quotations/calculate', data);
      return res.data;
    },
  });
}
