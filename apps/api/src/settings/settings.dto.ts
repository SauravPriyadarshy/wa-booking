import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SetBusinessHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @IsInt()
  @Min(0)
  startMin: number;

  @IsInt()
  @Min(1)
  endMin: number;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class AddHolidayDto {
  @IsString()
  dateISO: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  name?: string;

  /** When true, pending & confirmed bookings overlapping this calendar day are cancelled with reason HOLIDAY. */
  @IsOptional()
  @IsBoolean()
  cancelAffectedBookings?: boolean;
}

