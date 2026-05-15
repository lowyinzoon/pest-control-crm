import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.dashboardService.getStats(branchId);
  }

  @Get('revenue-chart')
  getRevenueChart(
    @CurrentUser() user: JwtPayload,
    @Query('months') months?: number,
  ) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.dashboardService.getRevenueChart(branchId, months);
  }

  @Get('today-jobs')
  getTodayJobs(@CurrentUser() user: JwtPayload) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.dashboardService.getTodayJobs(branchId);
  }
}
