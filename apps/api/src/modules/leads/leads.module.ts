import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, ActivityLogService],
  exports: [LeadsService],
})
export class LeadsModule {}
