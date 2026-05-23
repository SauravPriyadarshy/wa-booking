import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class HubCreateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class HubCreateTicketDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH';

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

