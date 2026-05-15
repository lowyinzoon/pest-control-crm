import { IsString, IsOptional, IsBoolean, IsEnum, IsInt } from 'class-validator';
import { JobPriority, RecurringFrequency } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  quotationId?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsString()
  scheduledDate: string;

  @IsOptional()
  @IsString()
  scheduledEndDate?: string;

  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringFrequency)
  recurringFrequency?: RecurringFrequency;

  @IsOptional()
  @IsInt()
  recurringCount?: number;
}
