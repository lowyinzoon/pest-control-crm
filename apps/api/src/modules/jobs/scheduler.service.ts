import { Injectable } from '@nestjs/common';
import { RecurringFrequency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  constructor(private prisma: PrismaService) {}

  async generateRecurringJobs(parentJobId: string, count: number = 12) {
    const parent = await this.prisma.job.findUnique({
      where: { id: parentJobId },
    });

    if (!parent || !parent.isRecurring || !parent.recurringFrequency) {
      return [];
    }

    const jobs = [];
    let currentDate = new Date(parent.scheduledDate);

    for (let i = 0; i < count; i++) {
      currentDate = this.getNextDate(currentDate, parent.recurringFrequency);

      const branch = await this.prisma.branch.findUnique({
        where: { id: parent.branchId },
      });
      const branchCode = branch?.code ?? 'XX';
      const year = currentDate.getFullYear();
      const jobCount = await this.prisma.job.count({
        where: { branchId: parent.branchId },
      });
      const code = `JOB-${branchCode}-${year}-${String(jobCount + i + 1).padStart(5, '0')}`;

      const job = await this.prisma.job.create({
        data: {
          code,
          customerId: parent.customerId,
          quotationId: parent.quotationId,
          technicianId: parent.technicianId,
          scheduledDate: currentDate,
          scheduledEndDate: parent.scheduledEndDate
            ? new Date(currentDate.getTime() + (new Date(parent.scheduledEndDate).getTime() - new Date(parent.scheduledDate).getTime()))
            : null,
          priority: parent.priority,
          serviceType: parent.serviceType,
          description: parent.description,
          address: parent.address,
          isRecurring: false,
          parentJobId: parent.id,
          createdById: parent.createdById,
          branchId: parent.branchId,
        },
      });
      jobs.push(job);
    }

    return jobs;
  }

  private getNextDate(current: Date, frequency: RecurringFrequency): Date {
    const next = new Date(current);
    switch (frequency) {
      case RecurringFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurringFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case RecurringFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurringFrequency.BIMONTHLY:
        next.setMonth(next.getMonth() + 2);
        break;
      case RecurringFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case RecurringFrequency.BIANNUALLY:
        next.setMonth(next.getMonth() + 6);
        break;
      case RecurringFrequency.ANNUALLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
