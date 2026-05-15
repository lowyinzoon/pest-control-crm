import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { JobsService } from './jobs.service';
import { SchedulerService } from './scheduler.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('jobs')
@UseGuards(RolesGuard)
export class JobsController {
  constructor(
    private jobsService: JobsService,
    private schedulerService: SchedulerService,
  ) {}

  @Get()
  findAll(
    @Query() query: PaginationDto & { status?: JobStatus; technicianId?: string; from?: string; to?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.jobsService.findAll(query, branchId);
  }

  @Get('calendar')
  getCalendarEvents(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const branchId = user.role === 'SUPER_ADMIN' ? null : user.branchId;
    return this.jobsService.getCalendarEvents(branchId, from, to);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateJobDto, @CurrentUser() user: JwtPayload) {
    const branchId = user.branchId!;
    const job = await this.jobsService.create(dto, branchId, user.sub);

    if (dto.isRecurring && dto.recurringFrequency) {
      await this.schedulerService.generateRecurringJobs(job.id, dto.recurringCount ?? 12);
    }

    return job;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: JobStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobsService.updateStatus(id, status, user.sub);
  }

  @Post(':id/report')
  createServiceReport(
    @Param('id') id: string,
    @Body() data: { findings?: string; recommendations?: string; chemicalsUsed?: string; photos?: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobsService.createServiceReport(id, data, user.sub);
  }
}
