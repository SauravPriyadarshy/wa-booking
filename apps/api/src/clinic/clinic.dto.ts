import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClinicPaymentStatus, QueueStatus } from '@prisma/client';

export class WalkInRegisterDto {
  @IsString() staffId: string;
  @IsString() name: string;
  @IsString() phone: string;
  @IsOptional() @IsString() serviceId?: string;
}

export class NextPatientDto {
  @IsString() staffId: string;
}

export class UpdateQueueStatusDto {
  @IsEnum(QueueStatus) queueStatus: QueueStatus;
}

export class UpdateClinicPaymentDto {
  @IsEnum(ClinicPaymentStatus) paymentStatus: ClinicPaymentStatus;
}
