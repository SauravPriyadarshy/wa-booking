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
  phone?: string;
}

