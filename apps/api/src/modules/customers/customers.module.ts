import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, ActivityLogService],
  exports: [CustomersService],
})
export class CustomersModule {}
