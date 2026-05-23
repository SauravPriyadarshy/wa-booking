import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  priority?: string; // LOW | NORMAL | HIGH

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class UpdateTicketStatusDto {
  @IsString()
  status: string; // TicketStatus enum values
}

export class AddTicketNoteDto {
  @IsString()
  @MinLength(1)
  internalNotes: string;
}

export class AssignTicketDto {
  @IsOptional()
  @IsString()
  assignedToStaffId?: string;
}

