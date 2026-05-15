import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto, branchId?: string | null) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true, email: true, fullName: true, phone: true,
          role: true, isActive: true, branchId: true, createdAt: true,
          branch: { select: { name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, isActive: true, branchId: true, createdAt: true,
        branch: { select: { name: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { fullName?: string; phone?: string; role?: string; isActive?: boolean; branchId?: string }) {
    return this.prisma.user.update({ where: { id }, data: data as any });
  }

  async remove(id: string) {
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
