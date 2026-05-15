import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { PricingService } from './pricing.service';
import { QuotationsController } from './quotations.controller';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService, PricingService, ActivityLogService],
  exports: [QuotationsService, PricingService],
})
export class QuotationsModule {}
