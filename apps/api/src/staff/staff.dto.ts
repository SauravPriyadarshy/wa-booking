import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class ToggleAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;
}

export class SetStaffHoursDto {
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
  isOff?: boolean;
}

