import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { SchedulerService } from './scheduler.service';
import { JobsController } from './jobs.controller';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, SchedulerService, ActivityLogService],
  exports: [JobsService],
})
export class JobsModule {}
