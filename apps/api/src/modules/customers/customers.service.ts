import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { PaginationDto, buildPaginationMeta } from '../../common/dto/pagination.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async findAll(query: PaginationDto, branchId?: string | null) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { branch: { select: { name: true, code: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        branch: { select: { name: true, code: true } },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { createdBy: { select: { fullName: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto, branchId: string, userId: string) {
    const code = await this.generateCode(branchId);
    const customer = await this.prisma.customer.create({
      data: { ...dto, code, branchId },
    });

    await this.activityLog.log({
      customerId: customer.id,
      type: ActivityType.NOTE,
      title: 'Customer created',
      description: `Customer ${customer.contactPerson} was created`,
      createdById: userId,
    });

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, userId: string) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    await this.activityLog.log({
      customerId: customer.id,
      type: ActivityType.NOTE,
      title: 'Customer updated',
      description: 'Customer details were updated',
      createdById: userId,
    });

    return customer;
  }

  async remove(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  private async generateCode(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    const branchCode = branch?.code ?? 'XX';
    const count = await this.prisma.customer.count({ where: { branchId } });
    const seq = String(count + 1).padStart(5, '0');
    return `CUST-${branchCode}-${seq}`;
  }
}
