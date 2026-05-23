import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsInt()
  @Min(5)
  durationMin: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferBeforeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferAfterMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferBeforeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferAfterMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

