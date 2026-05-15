import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(branchId?: string | null) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      todayJobs,
      ongoingServices,
      completedThisMonth,
      pendingQuotations,
      monthlyRevenue,
      activeCustomers,
    ] = await Promise.all([
      this.prisma.job.count({
        where: {
          ...where,
          scheduledDate: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      }),
      this.prisma.job.count({
        where: { ...where, status: 'IN_PROGRESS' },
      }),
      this.prisma.job.count({
        where: {
          ...where,
          status: 'COMPLETED',
          updatedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      this.prisma.quotation.count({
        where: { ...where, status: { in: ['DRAFT', 'PENDING_APPROVAL', 'SENT'] } },
      }),
      this.prisma.quotation.aggregate({
        where: {
          ...where,
          status: 'ACCEPTED',
          updatedAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { finalTotal: true },
      }),
      this.prisma.customer.count({
        where: { ...where, status: 'ACTIVE' },
      }),
    ]);

    return {
      todayJobs,
      ongoingServices,
      completedServices: completedThisMonth,
      pendingQuotations,
      monthlyRevenue: monthlyRevenue._sum.finalTotal ?? 0,
      activeCustomers,
    };
  }

  async getRevenueChart(branchId?: string | null, months: number = 6) {
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const where: any = {
        status: 'ACCEPTED',
        updatedAt: { gte: start, lt: end },
      };
      if (branchId) where.branchId = branchId;

      const result = await this.prisma.quotation.aggregate({
        where,
        _sum: { finalTotal: true },
      });

      data.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: result._sum.finalTotal ?? 0,
      });
    }

    return data;
  }

  async getTodayJobs(branchId?: string | null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      scheduledDate: { gte: today, lt: tomorrow },
      status: { not: 'CANCELLED' },
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.job.findMany({
      where,
      include: {
        customer: { select: { contactPerson: true, companyName: true, address: true } },
        technician: { select: { fullName: true } },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });
  }
}
