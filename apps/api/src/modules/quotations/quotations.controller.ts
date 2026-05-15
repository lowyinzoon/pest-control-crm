import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { QuotationStatus } from '@prisma/client';
import { QuotationsService } from './quotations.service';
import { PricingService } from './pricing.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('quotations')
@UseGuards(RolesGuard)
export class QuotationsController {
  constructor(
    private quotationsService: QuotationsService,
    private pricingService: PricingService,
  ) {}

  @Get()
  findAll(
    @Query() query: PaginationDto & { status?: QuotationStatus },
    @CurrentUser() user: JwtPayload,
  ) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.quotationsService.findAll(query, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user: JwtPayload) {
    const branchId = user.branchId!;
    return this.quotationsService.create(dto, branchId, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.quotationsService.update(id, dto, user.sub);
  }

  @Post(':id/submit')
  submitForApproval(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quotationsService.submitForApproval(id, user.sub);
  }

  @Post(':id/approve')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN')
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quotationsService.approve(id, user.sub);
  }

  @Post(':id/reject')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN')
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.quotationsService.reject(id, reason, user.sub);
  }

  @Post(':id/send')
  markSent(@Param('id') id: string) {
    return this.quotationsService.markSent(id);
  }

  @Post(':id/accept')
  markAccepted(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.quotationsService.markAccepted(id, user.sub);
  }

  @Post('calculate')
  calculatePrice(@Body() body: any) {
    return this.pricingService.calculateLineItem(body);
  }
}
