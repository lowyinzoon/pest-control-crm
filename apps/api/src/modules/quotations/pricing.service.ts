import { Injectable } from '@nestjs/common';
import { PricingType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface PriceCalculation {
  unitPrice: number;
  subtotal: number;
  costTotal: number;
  gmPercent: number;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async calculateLineItem(params: {
    serviceType: string;
    pricingType: PricingType;
    quantity: number;
    area?: number;
    frequency?: number;
    unitPrice?: number;
    costPerUnit?: number;
    branchId?: string;
  }): Promise<PriceCalculation> {
    const { serviceType, pricingType, quantity, area, frequency = 1, branchId } = params;

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        serviceType,
        isActive: true,
        OR: [{ branchId }, { branchId: null }],
      },
      orderBy: { branchId: 'desc' },
    });

    let unitPrice = params.unitPrice ?? rule?.baseRate ?? 0;
    let costPerUnit = params.costPerUnit ?? rule?.costRate ?? 0;

    if (pricingType === PricingType.PER_SQFT && area) {
      const tier = await this.findAreaTier(serviceType, area, branchId);
      if (tier) {
        unitPrice = tier.ratePerSqft;
      }
      const subtotal = unitPrice * area * frequency;
      const costTotal = costPerUnit * area * frequency;
      const gmPercent = subtotal > 0 ? ((subtotal - costTotal) / subtotal) * 100 : 0;
      return { unitPrice, subtotal, costTotal, gmPercent };
    }

    if (pricingType === PricingType.PER_UNIT) {
      const subtotal = unitPrice * quantity * frequency;
      const costTotal = costPerUnit * quantity * frequency;
      const gmPercent = subtotal > 0 ? ((subtotal - costTotal) / subtotal) * 100 : 0;
      return { unitPrice, subtotal, costTotal, gmPercent };
    }

    if (pricingType === PricingType.PER_VISIT) {
      const subtotal = unitPrice * frequency;
      const costTotal = costPerUnit * frequency;
      const gmPercent = subtotal > 0 ? ((subtotal - costTotal) / subtotal) * 100 : 0;
      return { unitPrice, subtotal, costTotal, gmPercent };
    }

    // FIXED or PACKAGE
    const subtotal = unitPrice * quantity;
    const costTotal = costPerUnit * quantity;
    const gmPercent = subtotal > 0 ? ((subtotal - costTotal) / subtotal) * 100 : 0;
    return { unitPrice, subtotal, costTotal, gmPercent };
  }

  async calculateQuotationTotals(items: PriceCalculation[], discount: number, logisticsFee: number, tax: number) {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const costTotal = items.reduce((sum, item) => sum + item.costTotal, 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const finalTotal = afterDiscount + logisticsFee + taxAmount;
    const gmPercent = finalTotal > 0 ? ((finalTotal - costTotal) / finalTotal) * 100 : 0;

    return {
      subtotal,
      discountAmount,
      logisticsFee,
      taxAmount,
      finalTotal,
      costTotal,
      gmPercent,
    };
  }

  private async findAreaTier(serviceType: string, area: number, branchId?: string) {
    return this.prisma.areaTier.findFirst({
      where: {
        serviceType,
        minArea: { lte: area },
        OR: [
          { maxArea: { gte: area } },
          { maxArea: null },
        ],
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
      orderBy: { minArea: 'asc' },
    });
  }
}
