import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

export function useLeads(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const res = await apiClient.get('/leads', { params });
      return res.data;
    },
  });
}

export function useLeadsKanban() {
  return useQuery({
    queryKey: ['leads', 'kanban'],
    queryFn: async () => {
      const res = await apiClient.get('/leads/kanban');
      return res.data;
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const res = await apiClient.get(`/leads/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/leads', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead created successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create lead', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.patch(`/leads/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update lead', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await apiClient.patch(`/leads/${id}/stage`, { stage });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead stage updated' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update stage', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/leads/${id}/convert`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Lead converted to customer' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to convert lead', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}
