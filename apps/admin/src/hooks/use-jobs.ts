import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

export function useJobs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const res = await apiClient.get('/jobs', { params });
      return res.data;
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const res = await apiClient.get(`/jobs/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useJobCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ['jobs', 'calendar', from, to],
    queryFn: async () => {
      const res = await apiClient.get('/jobs/calendar', { params: { from, to } });
      return res.data;
    },
    enabled: !!from && !!to,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/jobs', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job created successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create job', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.patch(`/jobs/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update job', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateJobStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/jobs/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job status updated' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update status', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });
}
