import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN')
  findAll(@Query() query: PaginationDto, @CurrentUser() user: JwtPayload) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.usersService.findAll(query, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'BRANCH_MANAGER')
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
