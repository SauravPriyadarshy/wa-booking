import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoachingStreamKey, EnrollmentStatus } from '@prisma/client';

export class CreateStudentDto {
  @IsString() name: string;
  @IsOptional() @IsString() parentName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() classGrade?: string;
  @IsOptional() @IsString() batch?: string;
  @IsOptional() @IsString() course?: string;
  @IsOptional() @IsString() batchId?: string;
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
  @IsString() dateISO: string;
  @IsBoolean() present: boolean;
}

export class CreateFeeRecordDto {
  @IsString() studentId: string;
  @IsString() month: string;
  @IsOptional() @IsInt() @Min(0) amountCents?: number;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() courseName?: string;
  /** Installment mode — total in paise */
  @IsOptional() @IsInt() @Min(1) totalAmount?: number;
  @IsOptional() @IsInt() @Min(1) numberOfInstallments?: number;
  @IsOptional() @IsArray() @IsDateString({}, { each: true }) dueDates?: string[];
}

export class RecordFeePaymentDto {
  @IsInt() @Min(1) paidAmountCents: number;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateCourseDto {
  @IsString() streamId: string;
  @IsString() name: string;
}

export class CreateBatchDto {
  @IsString() courseId: string;
  @IsString() name: string;
  @IsOptional() @IsString() roomNumber?: string;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) daysOfWeek: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) staffIds?: string[];
}

export class CheckBatchConflictDto {
  @IsOptional() @IsString() excludeBatchId?: string;
  @IsOptional() @IsString() roomNumber?: string;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) daysOfWeek: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) staffIds?: string[];
}

export class CreateEnrollmentDto {
  @IsString() studentId: string;
  @IsString() batchId: string;
}

export class UpdateEnrollmentDto {
  @IsEnum(EnrollmentStatus) status: EnrollmentStatus;
}

export class UpdateStaffSpecializationsDto {
  @IsArray() @IsString({ each: true }) specializations: string[];
}

export class BulkAttendanceBodyDto {
  @IsString() dateISO: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceRecordDto)
  records: BulkAttendanceRecordDto[];
}

export class BulkAttendanceRecordDto {
  @IsString() studentId: string;
  @IsBoolean() present: boolean;
}

export class EnsureStreamsDto {
  @IsOptional() @IsArray() @IsEnum(CoachingStreamKey, { each: true }) keys?: CoachingStreamKey[];
}
