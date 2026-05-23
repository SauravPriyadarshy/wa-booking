import { IsBoolean, IsInt, IsOptional, IsString, IsTimeZone, Matches, Max, Min } from 'class-validator';

export class UpdateBusinessProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{3,60}$/, { message: 'Slug must be lowercase letters, numbers and hyphens only' })
  slug?: string;

  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}

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

