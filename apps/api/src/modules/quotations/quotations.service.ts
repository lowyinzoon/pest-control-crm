import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityType, QuotationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from './pricing.service';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { PaginationDto, buildPaginationMeta } from '../../common/dto/pagination.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private activityLog: ActivityLogService,
  ) {}

  async findAll(query: PaginationDto & { status?: QuotationStatus }, branchId?: string | null) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', status } = query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { customer: { contactPerson: { contains: search, mode: 'insensitive' } } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { contactPerson: true, companyName: true, code: true } },
          createdBy: { select: { fullName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { fullName: true, email: true } },
        approvedBy: { select: { fullName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        branch: { select: { name: true, code: true } },
      },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async create(dto: CreateQuotationDto, branchId: string, userId: string) {
    const code = await this.generateCode(branchId);

    const itemCalculations = await Promise.all(
      dto.items.map((item) =>
        this.pricingService.calculateLineItem({
          serviceType: item.serviceType,
          pricingType: item.pricingType,
          quantity: item.quantity ?? 1,
          area: item.area,
          frequency: item.frequency ?? 1,
          unitPrice: item.unitPrice,
          costPerUnit: item.costPerUnit,
          branchId,
        }),
      ),
    );

    const totals = await this.pricingService.calculateQuotationTotals(
      itemCalculations,
      dto.discountPercent ?? 0,
      dto.logisticsFee ?? 0,
      dto.tax ?? 0,
    );

    const quotation = await this.prisma.quotation.create({
      data: {
        code,
        customerId: dto.customerId,
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        discountPercent: dto.discountPercent ?? 0,
        logisticsFee: totals.logisticsFee,
        tax: totals.taxAmount,
        finalTotal: totals.finalTotal,
        costTotal: totals.costTotal,
        gmPercent: totals.gmPercent,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        createdById: userId,
        branchId,
        items: {
          create: dto.items.map((item, index) => ({
            serviceType: item.serviceType,
            description: item.description,
            pricingType: item.pricingType,
            quantity: item.quantity ?? 1,
            unitPrice: itemCalculations[index].unitPrice,
            area: item.area,
            frequency: item.frequency ?? 1,
            subtotal: itemCalculations[index].subtotal,
            costPerUnit: item.costPerUnit ?? 0,
            costTotal: itemCalculations[index].costTotal,
            sortOrder: index,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    await this.activityLog.log({
      customerId: dto.customerId,
      type: ActivityType.QUOTATION,
      title: `Quotation ${code} created`,
      description: `Quotation for RM${totals.finalTotal.toFixed(2)}`,
      metadata: { quotationId: quotation.id, total: totals.finalTotal },
      createdById: userId,
    });

    return quotation;
  }

  async update(id: string, dto: UpdateQuotationDto, userId: string) {
    const existing = await this.findOne(id);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft quotations can be edited');
    }

    if (dto.items) {
      await this.prisma.quotationItem.deleteMany({ where: { quotationId: id } });

      const itemCalculations = await Promise.all(
        dto.items.map((item) =>
          this.pricingService.calculateLineItem({
            serviceType: item.serviceType,
            pricingType: item.pricingType,
            quantity: item.quantity ?? 1,
            area: item.area,
            frequency: item.frequency ?? 1,
            unitPrice: item.unitPrice,
            costPerUnit: item.costPerUnit,
            branchId: existing.branchId,
          }),
        ),
      );

      const totals = await this.pricingService.calculateQuotationTotals(
        itemCalculations,
        dto.discountPercent ?? existing.discountPercent,
        dto.logisticsFee ?? existing.logisticsFee,
        dto.tax ?? existing.tax,
      );

      return this.prisma.quotation.update({
        where: { id },
        data: {
          subtotal: totals.subtotal,
          discount: totals.discountAmount,
          discountPercent: dto.discountPercent ?? existing.discountPercent,
          logisticsFee: totals.logisticsFee,
          tax: totals.taxAmount,
          finalTotal: totals.finalTotal,
          costTotal: totals.costTotal,
          gmPercent: totals.gmPercent,
          notes: dto.notes ?? existing.notes,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : existing.validUntil,
          items: {
            create: dto.items.map((item, index) => ({
              serviceType: item.serviceType,
              description: item.description,
              pricingType: item.pricingType,
              quantity: item.quantity ?? 1,
              unitPrice: itemCalculations[index].unitPrice,
              area: item.area,
              frequency: item.frequency ?? 1,
              subtotal: itemCalculations[index].subtotal,
              costPerUnit: item.costPerUnit ?? 0,
              costTotal: itemCalculations[index].costTotal,
              sortOrder: index,
            })),
          },
        },
        include: { items: true, customer: true },
      });
    }

    return this.prisma.quotation.update({
      where: { id },
      data: {
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        discountPercent: dto.discountPercent,
        logisticsFee: dto.logisticsFee,
      },
      include: { items: true, customer: true },
    });
  }

  async submitForApproval(id: string, userId: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== 'DRAFT') {
      throw new BadRequestException('Only draft quotations can be submitted');
    }
    return this.prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.PENDING_APPROVAL },
    });
  }

  async approve(id: string, userId: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Quotation is not pending approval');
    }
    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.APPROVED, approvedById: userId },
    });

    await this.activityLog.log({
      customerId: quotation.customerId,
      type: ActivityType.QUOTATION,
      title: `Quotation ${quotation.code} approved`,
      createdById: userId,
    });

    return updated;
  }

  async reject(id: string, reason: string, userId: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Quotation is not pending approval');
    }
    return this.prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.REJECTED, rejectionReason: reason },
    });
  }

  async markSent(id: string) {
    return this.prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.SENT },
    });
  }

  async markAccepted(id: string, userId: string) {
    const quotation = await this.findOne(id);
    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.ACCEPTED },
    });

    await this.activityLog.log({
      customerId: quotation.customerId,
      type: ActivityType.QUOTATION,
      title: `Quotation ${quotation.code} accepted by customer`,
      createdById: userId,
    });

    return updated;
  }

  private async generateCode(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    const branchCode = branch?.code ?? 'XX';
    const year = new Date().getFullYear();
    const count = await this.prisma.quotation.count({
      where: { branchId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const seq = String(count + 1).padStart(5, '0');
    return `QUO-${branchCode}-${year}-${seq}`;
  }
}
