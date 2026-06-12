import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @IsOptional()
  @IsString()
  customSpecialization?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  activationCode?: string;
}

export class RedeemActivationCodeDto {
  @IsString()
  @MinLength(3)
  code: string;
}

