'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats, useRevenueChart, useTodayJobs } from '@/hooks/use-dashboard';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Calendar,
  Users,
  FileText,
  CheckCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: statsRes, isLoading: statsLoading } = useDashboardStats();
  const { data: chartRes, isLoading: chartLoading } = useRevenueChart(6);
  const { data: todayRes, isLoading: todayLoading } = useTodayJobs();

  const stats = statsRes?.data ?? statsRes ?? {};
  const chart = chartRes?.data ?? chartRes ?? [];
  const todayJobs = todayRes?.data ?? todayRes ?? [];

  const statCards = [
    { label: "Today's Jobs", value: stats.todayJobs ?? 0, icon: Calendar, color: 'text-blue-600' },
    { label: 'Ongoing Services', value: stats.ongoingServices ?? 0, icon: TrendingUp, color: 'text-orange-600' },
    { label: 'Completed (Month)', value: stats.completedServices ?? 0, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Pending Quotations', value: stats.pendingQuotations ?? 0, icon: FileText, color: 'text-purple-600' },
    { label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue ?? 0), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Active Customers', value: stats.activeCustomers ?? 0, icon: Users, color: 'text-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-7 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold mt-1">{card.value}</p>
                    </div>
                    <card.icon className={`h-8 w-8 ${card.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartLoading ? (
                <div className="flex items-end justify-between h-full gap-2 pb-8 px-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 60}%` }} />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : todayJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todayJobs.map((job: any) => (
                  <div key={job.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {job.customer?.contactPerson}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.customer?.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(job.scheduledDate)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
