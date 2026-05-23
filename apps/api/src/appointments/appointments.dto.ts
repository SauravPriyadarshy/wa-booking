import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  customerId: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsDateString()
  startAt: string;
}

export class UpdateAppointmentStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

