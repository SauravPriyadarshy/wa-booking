import { IsOptional, IsString, MinLength } from 'class-validator';

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

