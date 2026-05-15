import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('branches')
@UseGuards(RolesGuard)
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() data: { name: string; code: string; address?: string; phone?: string; email?: string }) {
    return this.branchesService.create(data);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER')
  update(@Param('id') id: string, @Body() data: any) {
    return this.branchesService.update(id, data);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
