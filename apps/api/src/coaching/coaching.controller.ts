import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CoachingService } from './coaching.service';
import { CreateStudentDto, UpdateStudentDto, MarkAttendanceDto, CreateFeeRecordDto } from './coaching.dto';

@Controller('coaching')
@UseGuards(JwtUserGuard, RequireBusinessGuard)
export class CoachingController {
  constructor(private coaching: CoachingService) {}

  @Get('students')
  listStudents(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.listStudents(user.businessId!);
  }

  @Post('students')
  createStudent(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateStudentDto) {
    return this.coaching.createStudent(user.businessId!, dto);
  }

  @Get('students/:id')
  getStudent(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.getStudent(user.businessId!, id);
  }

  @Patch('students/:id')
  updateStudent(@AuthUserDecorator() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.coaching.updateStudent(user.businessId!, id, dto);
  }

  @Post('attendance')
  markAttendance(@AuthUserDecorator() user: AuthUser, @Body() dto: MarkAttendanceDto) {
    return this.coaching.markAttendance(user.businessId!, dto);
  }

  @Post('attendance/bulk')
  bulkAttendance(
    @AuthUserDecorator() user: AuthUser,
    @Body() body: { dateISO: string; records: Array<{ studentId: string; present: boolean }> },
  ) {
    return this.coaching.bulkAttendance(user.businessId!, body.dateISO, body.records);
  }

  @Get('fees/dashboard')
  feesDashboard(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.feesDashboard(user.businessId!);
  }

  @Post('fees')
  createFeeRecord(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateFeeRecordDto) {
    return this.coaching.createFeeRecord(user.businessId!, dto);
  }

  @Patch('fees/:id/paid')
  markFeePaid(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.markFeePaid(user.businessId!, id);
  }
}
