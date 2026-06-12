import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class SuperCreateBusinessDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(3)
  adminUsername: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;
}

export class CreateActivationCodeDto {
  @IsString()
  @MinLength(3)
  code: string;

  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsInt()
  @Min(1)
  validityDays: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SetBusinessPlanDto {
  @IsString()
  businessId: string;

  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;
}

