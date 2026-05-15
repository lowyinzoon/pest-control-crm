import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityType, JobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { PaginationDto, buildPaginationMeta } from '../../common/dto/pagination.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async findAll(query: PaginationDto & { status?: JobStatus; technicianId?: string; from?: string; to?: string }, branchId?: string | null) {
    const { page = 1, limit = 20, search, sortBy = 'scheduledDate', sortOrder = 'asc', status, technicianId, from, to } = query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (technicianId) where.technicianId = technicianId;
    if (from || to) {
      where.scheduledDate = {};
      if (from) where.scheduledDate.gte = new Date(from);
      if (to) where.scheduledDate.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { customer: { contactPerson: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { contactPerson: true, companyName: true, address: true, phone: true } },
          technician: { select: { fullName: true } },
          quotation: { select: { code: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: { select: { fullName: true, email: true, phone: true } },
        quotation: { select: { code: true, finalTotal: true } },
        serviceReport: true,
        branch: { select: { name: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async create(dto: CreateJobDto, branchId: string, userId: string) {
    const code = await this.generateCode(branchId);
    const job = await this.prisma.job.create({
      data: {
        code,
        customerId: dto.customerId,
        quotationId: dto.quotationId,
        technicianId: dto.technicianId,
        scheduledDate: new Date(dto.scheduledDate),
        scheduledEndDate: dto.scheduledEndDate ? new Date(dto.scheduledEndDate) : null,
        priority: dto.priority,
        serviceType: dto.serviceType,
        description: dto.description,
        address: dto.address,
        isRecurring: dto.isRecurring ?? false,
        recurringFrequency: dto.recurringFrequency,
        createdById: userId,
        branchId,
      },
      include: { customer: true, technician: { select: { fullName: true } } },
    });

    await this.activityLog.log({
      customerId: dto.customerId,
      type: ActivityType.SERVICE_VISIT,
      title: `Job ${code} scheduled`,
      description: `Job scheduled for ${dto.scheduledDate}`,
      metadata: { jobId: job.id },
      createdById: userId,
    });

    return job;
  }

  async update(id: string, dto: UpdateJobDto) {
    return this.prisma.job.update({
      where: { id },
      data: {
        ...dto,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        scheduledEndDate: dto.scheduledEndDate ? new Date(dto.scheduledEndDate) : undefined,
      },
    });
  }

  async updateStatus(id: string, status: JobStatus, userId: string) {
    const job = await this.findOne(id);

    const validTransitions: Record<string, string[]> = {
      SCHEDULED: ['EN_ROUTE', 'CANCELLED', 'RESCHEDULED'],
      EN_ROUTE: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      RESCHEDULED: ['SCHEDULED', 'CANCELLED'],
    };

    const allowed = validTransitions[job.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${job.status} to ${status}`);
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data: { status },
    });

    if (status === 'COMPLETED') {
      await this.activityLog.log({
        customerId: job.customerId,
        type: ActivityType.SERVICE_VISIT,
        title: `Job ${job.code} completed`,
        createdById: userId,
      });
    }

    return updated;
  }

  async createServiceReport(
    jobId: string,
    data: { findings?: string; recommendations?: string; chemicalsUsed?: string; photos?: string[] },
    userId: string,
  ) {
    const job = await this.findOne(jobId);
    return this.prisma.serviceReport.create({
      data: {
        jobId,
        findings: data.findings,
        recommendations: data.recommendations,
        chemicalsUsed: data.chemicalsUsed,
        photos: data.photos || [],
        technicianId: userId,
        completedAt: new Date(),
      },
    });
  }

  async getCalendarEvents(branchId: string | null, from: string, to: string) {
    const where: any = {
      scheduledDate: {
        gte: new Date(from),
        lte: new Date(to),
      },
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.job.findMany({
      where,
      include: {
        customer: { select: { contactPerson: true, companyName: true, address: true } },
        technician: { select: { fullName: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  private async generateCode(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    const branchCode = branch?.code ?? 'XX';
    const year = new Date().getFullYear();
    const count = await this.prisma.job.count({
      where: { branchId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const seq = String(count + 1).padStart(5, '0');
    return `JOB-${branchCode}-${year}-${seq}`;
  }
}
