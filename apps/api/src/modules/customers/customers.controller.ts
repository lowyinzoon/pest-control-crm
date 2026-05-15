import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('customers')
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(@Query() query: PaginationDto, @CurrentUser() user: JwtPayload) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.customersService.findAll(query, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: JwtPayload) {
    const branchId = dto.branchId || user.branchId!;
    return this.customersService.create(dto, branchId, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.customersService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
