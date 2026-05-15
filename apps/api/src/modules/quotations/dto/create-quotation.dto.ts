import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingType } from '@prisma/client';

export class QuotationItemDto {
  @IsString()
  serviceType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PricingType)
  pricingType: PricingType;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsNumber()
  frequency?: number;

  @IsOptional()
  @IsNumber()
  costPerUnit?: number;
}

export class CreateQuotationDto {
  @IsString()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  logisticsFee?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  validUntil?: string;
}
