import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CoachingService } from './coaching.service';
import {
  BulkAttendanceBodyDto,
  CheckBatchConflictDto,
  CreateBatchDto,
  CreateCoachingTestDto,
  CreateCourseDto,
  CreateEnrollmentDto,
  CreateFeeRecordDto,
  CreateStudentDto,
  DirectAddStudentDto,
  EnsureStreamsDto,
  MarkAttendanceDto,
  RecordFeePaymentDto,
  ScoreBatchTestDto,
  UpdateEnrollmentDto,
  UpdateFeeLedgerDto,
  UpdateStaffSpecializationsDto,
  UpdateStudentDto,
} from './coaching.dto';

@Controller('coaching')
@UseGuards(JwtUserGuard, RequireBusinessGuard)
export class CoachingController {
  constructor(private coaching: CoachingService) {}

  @Get('matrix')
  getMatrix(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.getMatrix(user.businessId!);
  }

  @Post('streams/ensure')
  ensureStreams(@AuthUserDecorator() user: AuthUser, @Body() dto: EnsureStreamsDto) {
    return this.coaching.ensureStreams(user.businessId!, dto.keys);
  }

  @Post('courses')
  createCourse(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateCourseDto) {
    return this.coaching.createCourse(user.businessId!, dto);
  }

  @Get('batches')
  listBatches(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.listBatches(user.businessId!);
  }

  @Get('batches/:id/ops')
  getBatchOps(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.getBatchOps(user.businessId!, id);
  }

  @Get('batches/:id/broadcast-roster')
  getBatchBroadcastRoster(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.getBatchBroadcastRoster(user.businessId!, id);
  }

  @Post('batches/check-conflict')
  checkBatchConflict(@AuthUserDecorator() user: AuthUser, @Body() dto: CheckBatchConflictDto) {
    return this.coaching.checkBatchConflict(user.businessId!, dto);
  }

  @Post('batches')
  createBatch(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateBatchDto) {
    return this.coaching.createBatch(user.businessId!, dto);
  }

  @Get('staff')
  listStaff(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.listStaff(user.businessId!);
  }

  @Patch('staff/:id/specializations')
  updateStaffSpecializations(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStaffSpecializationsDto,
  ) {
    return this.coaching.updateStaffSpecializations(user.businessId!, id, dto);
  }

  @Post('enrollments')
  createEnrollment(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateEnrollmentDto) {
    return this.coaching.createEnrollment(user.businessId!, dto);
  }

  @Patch('enrollments/:id')
  updateEnrollment(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.coaching.updateEnrollment(user.businessId!, id, dto);
  }

  @Get('students')
  listStudents(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.listStudents(user.businessId!);
  }

  @Post('students')
  createStudent(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateStudentDto) {
    return this.coaching.createStudent(user.businessId!, dto);
  }

  @Post('students/direct-add')
  directAddStudent(@AuthUserDecorator() user: AuthUser, @Body() dto: DirectAddStudentDto) {
    return this.coaching.directAddStudent(user.businessId!, dto);
  }

  @Get('students/:id')
  getStudent(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.getStudent(user.businessId!, id);
  }

  @Get('students/:id/report')
  getStudentReport(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.getStudentReport(user.businessId!, id);
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
  bulkAttendance(@AuthUserDecorator() user: AuthUser, @Body() body: BulkAttendanceBodyDto) {
    return this.coaching.bulkAttendance(user.businessId!, body.dateISO, body.records, body.batchId);
  }

  @Post('tests')
  createTest(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateCoachingTestDto) {
    return this.coaching.createTest(user.businessId!, dto);
  }

  @Post('tests/score-batch')
  scoreBatchTest(@AuthUserDecorator() user: AuthUser, @Body() dto: ScoreBatchTestDto) {
    return this.coaching.scoreBatchTest(user.businessId!, dto);
  }

  @Get('reports/overview')
  getReportsOverview(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.getReportsOverview(user.businessId!);
  }

  @Get('reports/batch/:id')
  getBatchReport(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.getBatchReport(user.businessId!, id);
  }

  @Get('fees/dashboard')
  feesDashboard(@AuthUserDecorator() user: AuthUser) {
    return this.coaching.feesDashboard(user.businessId!);
  }

  @Post('fees')
  createFeeRecord(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateFeeRecordDto) {
    return this.coaching.createFeeRecord(user.businessId!, dto);
  }

  @Patch('fees/:id/ledger')
  updateFeeLedger(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFeeLedgerDto,
  ) {
    return this.coaching.updateFeeLedger(user.businessId!, id, dto);
  }

  @Post('fees/:id/payment')
  recordFeePayment(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RecordFeePaymentDto,
  ) {
    return this.coaching.recordFeePayment(user.businessId!, id, dto);
  }

  @Patch('fees/:id/paid')
  markFeePaid(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.coaching.markFeePaid(user.businessId!, id);
  }
}
