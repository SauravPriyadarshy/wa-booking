import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertPaymentConfigDto {
  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  upiQrUrl?: string;

  @IsOptional()
  bankDetailsJson?: any;

  @IsOptional()
  @IsBoolean()
  allowCash?: boolean;
}

export class CreatePaymentDto {
  @IsString()
  appointmentId: string;

  @IsString()
  method: string; // UPI | CASH

  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;

  @IsOptional()
  @IsString()
  proofUrl?: string;
}

