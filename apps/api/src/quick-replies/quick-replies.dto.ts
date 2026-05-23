import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQuickReplyDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

