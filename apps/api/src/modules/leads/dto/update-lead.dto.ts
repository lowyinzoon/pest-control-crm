import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { LeadStage } from '@prisma/client';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @IsOptional()
  @IsEnum(LeadStage)
  stage?: LeadStage;
}
