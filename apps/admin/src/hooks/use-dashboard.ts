import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
  });
}

export function useRevenueChart(months?: number) {
  return useQuery({
    queryKey: ['dashboard', 'revenue-chart', months],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/revenue-chart', { params: { months } });
      return res.data;
    },
  });
}

export function useTodayJobs() {
  return useQuery({
    queryKey: ['dashboard', 'today-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/today-jobs');
      return res.data;
    },
  });
}
