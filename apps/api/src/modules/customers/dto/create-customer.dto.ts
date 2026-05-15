import { IsString, IsOptional, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { PropertyType, LeadSource } from '@prisma/client';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  contactPerson: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  gpsLng?: number;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
