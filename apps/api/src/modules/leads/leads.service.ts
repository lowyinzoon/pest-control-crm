import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, LeadStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { PaginationDto, buildPaginationMeta } from '../../common/dto/pagination.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async findAll(query: PaginationDto & { stage?: LeadStage }, branchId?: string | null) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', stage } = query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: { select: { fullName: true } },
          branch: { select: { name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findByStage(branchId?: string | null) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const stages = Object.values(LeadStage);
    const grouped: Record<string, typeof leads> = {};
    for (const stage of stages) {
      grouped[stage] = leads.filter((l) => l.stage === stage);
    }
    return grouped;
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { fullName: true, email: true } },
        customer: true,
        branch: { select: { name: true } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async create(dto: CreateLeadDto, branchId: string) {
    return this.prisma.lead.create({
      data: { ...dto, branchId },
    });
  }

  async update(id: string, dto: UpdateLeadDto) {
    return this.prisma.lead.update({
      where: { id },
      data: dto,
    });
  }

  async updateStage(id: string, stage: LeadStage) {
    return this.prisma.lead.update({
      where: { id },
      data: { stage },
    });
  }

  async convertToCustomer(id: string, userId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { branch: true } });
    if (!lead) throw new NotFoundException('Lead not found');

    const branchCode = lead.branch?.code ?? 'XX';
    const count = await this.prisma.customer.count({ where: { branchId: lead.branchId } });
    const code = `CUST-${branchCode}-${String(count + 1).padStart(5, '0')}`;

    const customer = await this.prisma.customer.create({
      data: {
        code,
        contactPerson: lead.contactPerson,
        companyName: lead.companyName,
        phone: lead.phone,
        email: lead.email,
        address: lead.address ?? '',
        propertyType: lead.propertyType,
        source: lead.source,
        branchId: lead.branchId,
      },
    });

    await this.prisma.lead.update({
      where: { id },
      data: { stage: LeadStage.CLOSED_WON, customerId: customer.id },
    });

    await this.activityLog.log({
      customerId: customer.id,
      type: ActivityType.LEAD_CONVERTED,
      title: 'Lead converted to customer',
      description: `Lead ${lead.contactPerson} was converted to customer ${code}`,
      createdById: userId,
    });

    return customer;
  }

  async remove(id: string) {
    return this.prisma.lead.delete({ where: { id } });
  }
}
