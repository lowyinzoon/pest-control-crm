import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('leads')
@UseGuards(RolesGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  findAll(
    @Query() query: PaginationDto & { stage?: LeadStage },
    @CurrentUser() user: JwtPayload,
  ) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.leadsService.findAll(query, branchId);
  }

  @Get('kanban')
  getKanban(@CurrentUser() user: JwtPayload) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.leadsService.findByStage(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: JwtPayload) {
    const branchId = dto.branchId || user.branchId!;
    return this.leadsService.create(dto, branchId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body('stage') stage: LeadStage) {
    return this.leadsService.updateStage(id, stage);
  }

  @Post(':id/convert')
  convertToCustomer(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leadsService.convertToCustomer(id, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
