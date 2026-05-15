import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(data: { name: string; code: string; address?: string; phone?: string; email?: string }) {
    const existing = await this.prisma.branch.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException('Branch code already exists');
    return this.prisma.branch.create({ data });
  }

  async update(id: string, data: { name?: string; address?: string; phone?: string; email?: string; isActive?: boolean }) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.branch.update({ where: { id }, data: { isActive: false } });
  }
}
