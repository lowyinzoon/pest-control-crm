import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    customerId: string;
    type: ActivityType;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    createdById: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        customerId: params.customerId,
        type: params.type,
        title: params.title,
        description: params.description,
        metadata: params.metadata as object,
        createdById: params.createdById,
      },
    });
  }

  async getByCustomer(customerId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { createdBy: { select: { fullName: true } } },
    });
  }
}
