import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateStudentDto {
  @IsString() name: string;
  @IsOptional() @IsString() parentName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() classGrade?: string;
  @IsOptional() @IsString() batch?: string;
  @IsOptional() @IsString() course?: string;
}

export class UpdateStudentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() classGrade?: string;
  @IsOptional() @IsString() batch?: string;
  @IsOptional() @IsString() course?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class MarkAttendanceDto {
  @IsString() studentId: string;
  @IsString() dateISO: string; // YYYY-MM-DD
  @IsBoolean() present: boolean;
}

export class CreateFeeRecordDto {
  @IsString() studentId: string;
  @IsInt() @Min(0) amountCents: number;
  @IsDateString() dueDate: string;
  @IsString() month: string; // "2026-06"
  @IsOptional() @IsString() notes?: string;
}

export class MarkFeePaidDto {
  @IsString() feeId: string;
}
