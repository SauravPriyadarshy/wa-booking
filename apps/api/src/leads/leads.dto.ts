import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LeadStage } from '@prisma/client';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadStageDto {
  @IsEnum(LeadStage)
  stage: LeadStage;

  @IsOptional()
  @IsString()
  @MinLength(0)
  notes?: string;
}

