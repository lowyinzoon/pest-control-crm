import { IsString, IsOptional, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { PropertyType, LeadSource } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  contactPerson: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
