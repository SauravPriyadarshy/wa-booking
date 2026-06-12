import { BadRequestException, Injectable } from '@nestjs/common';
import { CoachingStreamKey, EnrollmentStatus, FeePaymentMode, Prisma, StudentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from '../plans/plans.service';
import type {
  CheckBatchConflictDto,
  CreateBatchDto,
  CreateCourseDto,
  CreateEnrollmentDto,
  CreateFeeRecordDto,
  CreateStudentDto,
  DirectAddStudentDto,
  CreateCoachingTestDto,
  ScoreBatchTestDto,
  UpdateFeeLedgerDto,
  MarkAttendanceDto,
  RecordFeePaymentDto,
  UpdateEnrollmentDto,
  UpdateStaffSpecializationsDto,
  UpdateStudentDto,
} from './coaching.dto';

const DEFAULT_STREAMS: Array<{ key: CoachingStreamKey; name: string; sortOrder: number }> = [
  { key: CoachingStreamKey.SCHOOLING, name: 'Schooling', sortOrder: 0 },
  { key: CoachingStreamKey.JEE, name: 'IIT-JEE', sortOrder: 1 },
  { key: CoachingStreamKey.NEET, name: 'NEET', sortOrder: 2 },
  { key: CoachingStreamKey.CIVIL_SERVICES, name: 'BPSC / Civil Services', sortOrder: 3 },
  { key: CoachingStreamKey.SSC, name: 'SSC / Banking', sortOrder: 4 },
];

function parseTimeMin(time: string): number {
  const [h, m] = time.split(':').map((v) => Number(v));
  if (!Number.isFinite(h) || h < 0 || h > 23) throw new BadRequestException('Invalid startTime/endTime');
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function normalizeDays(days: string[]): string[] {
  return [...new Set(days.map((d) => d.trim().toUpperCase()).filter(Boolean))];
}

function daysOverlap(a: string[], b: string[]): boolean {
  const set = new Set(normalizeDays(a));
  return normalizeDays(b).some((d) => set.has(d));
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a0 = parseTimeMin(startA);
  const a1 = parseTimeMin(endA);
  const b0 = parseTimeMin(startB);
  const b1 = parseTimeMin(endB);
  if (a0 >= a1 || b0 >= b1) throw new BadRequestException('End time must be after start time');
  return a0 < b1 && b0 < a1;
}

type BatchScheduleRow = {
  id: string;
  roomNumber: string | null;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  staffAssignments: Array<{ staffId: string }>;
};

@Injectable()
export class CoachingService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
  ) {}

  private async requireCoaching(businessId: string) {
    await this.plans.assertFeature(businessId, 'coaching_module');
  }

  private detectScheduleConflict(
    candidate: CheckBatchConflictDto,
    existing: BatchScheduleRow[],
  ): { conflict: boolean; reason?: string } {
    for (const batch of existing) {
      if (candidate.excludeBatchId && batch.id === candidate.excludeBatchId) continue;
      if (!daysOverlap(candidate.daysOfWeek, batch.daysOfWeek)) continue;
      if (!timesOverlap(candidate.startTime, candidate.endTime, batch.startTime, batch.endTime)) continue;

      const room = candidate.roomNumber?.trim();
      if (room && batch.roomNumber?.trim() && room === batch.roomNumber.trim()) {
        return { conflict: true, reason: `Room ${room} is already booked at this time` };
      }

      const staffIds = candidate.staffIds ?? [];
      const batchStaff = new Set(batch.staffAssignments.map((s) => s.staffId));
      for (const sid of staffIds) {
        if (batchStaff.has(sid)) {
          return { conflict: true, reason: 'FACULTY_SCHEDULE_CONFLICT' };
        }
      }
    }
    return { conflict: false };
  }

  async ensureStreams(businessId: string, keys?: CoachingStreamKey[]) {
    await this.requireCoaching(businessId);
    const wanted = keys?.length ? keys : DEFAULT_STREAMS.map((s) => s.key);
    const defs = DEFAULT_STREAMS.filter((s) => wanted.includes(s.key));

    await Promise.all(
      defs.map((s) =>
        this.prisma.stream.upsert({
          where: { businessId_key: { businessId, key: s.key } },
          create: { businessId, key: s.key, name: s.name, sortOrder: s.sortOrder },
          update: { name: s.name, sortOrder: s.sortOrder, isActive: true },
        }),
      ),
    );

    return this.getMatrix(businessId);
  }

  async getMatrix(businessId: string) {
    await this.requireCoaching(businessId);
    const streams = await this.prisma.stream.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        key: true,
        name: true,
        courses: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            batches: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
              select: {
                id: true,
                name: true,
                roomNumber: true,
                startTime: true,
                endTime: true,
                daysOfWeek: true,
                _count: { select: { enrollments: { where: { status: EnrollmentStatus.ACTIVE } } } },
                staffAssignments: {
                  select: {
                    staff: {
                      select: {
                        id: true,
                        title: true,
                        user: { select: { name: true } },
                        specializations: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    return { streams };
  }

  async listStaff(businessId: string) {
    await this.requireCoaching(businessId);
    return this.prisma.staffProfile.findMany({
      where: { businessId, isAvailable: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        specialization: true,
        specializations: true,
        user: { select: { name: true } },
      },
    });
  }

  async updateStaffSpecializations(businessId: string, staffId: string, dto: UpdateStaffSpecializationsDto) {
    await this.requireCoaching(businessId);
    const staff = await this.prisma.staffProfile.findUnique({ where: { id: staffId }, select: { businessId: true } });
    if (!staff || staff.businessId !== businessId) throw new BadRequestException('Staff not found');
    return this.prisma.staffProfile.update({
      where: { id: staffId },
      data: { specializations: dto.specializations },
      select: { id: true, specializations: true },
    });
  }

  async createCourse(businessId: string, dto: CreateCourseDto) {
    await this.requireCoaching(businessId);
    const stream = await this.prisma.stream.findUnique({ where: { id: dto.streamId }, select: { businessId: true } });
    if (!stream || stream.businessId !== businessId) throw new BadRequestException('Stream not found');
    return this.prisma.course.create({
      data: { businessId, streamId: dto.streamId, name: dto.name.trim() },
      select: { id: true, name: true, streamId: true },
    });
  }

  async checkBatchConflict(businessId: string, dto: CheckBatchConflictDto) {
    await this.requireCoaching(businessId);
    const existing = await this.prisma.batch.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        roomNumber: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        staffAssignments: { select: { staffId: true } },
      },
    });
    return this.detectScheduleConflict(dto, existing);
  }

  async createBatch(businessId: string, dto: CreateBatchDto) {
    await this.requireCoaching(businessId);
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { businessId: true, name: true },
    });
    if (!course || course.businessId !== businessId) throw new BadRequestException('Course not found');

    const staffIds = dto.staffIds ?? [];
    if (staffIds.length) {
      const validStaff = await this.prisma.staffProfile.count({
        where: { businessId, id: { in: staffIds } },
      });
      if (validStaff !== staffIds.length) throw new BadRequestException('Invalid staff selection');
    }

    const existing = await this.prisma.batch.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        roomNumber: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        staffAssignments: { select: { staffId: true } },
      },
    });

    const conflict = this.detectScheduleConflict(
      {
        roomNumber: dto.roomNumber,
        startTime: dto.startTime,
        endTime: dto.endTime,
        daysOfWeek: dto.daysOfWeek,
        staffIds,
      },
      existing,
    );
    if (conflict.conflict) {
      throw new BadRequestException(conflict.reason ?? 'FACULTY_SCHEDULE_CONFLICT');
    }

    return this.prisma.batch.create({
      data: {
        businessId,
        courseId: dto.courseId,
        name: dto.name.trim(),
        roomNumber: dto.roomNumber?.trim() || null,
        feesAmountCents: dto.feesAmountCents ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        daysOfWeek: normalizeDays(dto.daysOfWeek),
        staffAssignments: staffIds.length
          ? { create: staffIds.map((staffId) => ({ staffId })) }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        roomNumber: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        courseId: true,
      },
    });
  }

  async createEnrollment(businessId: string, dto: CreateEnrollmentDto) {
    await this.requireCoaching(businessId);
    const [student, batch] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { businessId: true, name: true } }),
      this.prisma.batch.findUnique({
        where: { id: dto.batchId },
        select: { businessId: true, name: true, course: { select: { name: true } } },
      }),
    ]);
    if (!student || student.businessId !== businessId) throw new BadRequestException('Student not found');
    if (!batch || batch.businessId !== businessId) throw new BadRequestException('Batch not found');

    const enrollment = await this.prisma.batchEnrollment.upsert({
      where: { studentId_batchId: { studentId: dto.studentId, batchId: dto.batchId } },
      create: {
        studentId: dto.studentId,
        batchId: dto.batchId,
        status: EnrollmentStatus.ACTIVE,
      },
      update: { status: EnrollmentStatus.ACTIVE },
      select: {
        id: true,
        status: true,
        enrollmentDate: true,
        batch: { select: { id: true, name: true, course: { select: { name: true, stream: { select: { name: true } } } } } },
      },
    });

    await this.prisma.student.update({
      where: { id: dto.studentId },
      data: {
        batch: batch.name,
        course: batch.course.name,
        batchId: dto.batchId,
        status: StudentStatus.ACTIVE,
        isActive: true,
      },
    });

    return enrollment;
  }

  async updateEnrollment(businessId: string, enrollmentId: string, dto: UpdateEnrollmentDto) {
    await this.requireCoaching(businessId);
    const row = await this.prisma.batchEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { student: { select: { businessId: true } } },
    });
    if (!row || row.student.businessId !== businessId) throw new BadRequestException('Enrollment not found');
    return this.prisma.batchEnrollment.update({
      where: { id: enrollmentId },
      data: { status: dto.status },
      select: { id: true, status: true, batchId: true, studentId: true },
    });
  }

  async listStudents(businessId: string) {
    await this.requireCoaching(businessId);
    const students = await this.prisma.student.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        parentName: true,
        phone: true,
        classGrade: true,
        batch: true,
        course: true,
        admissionAt: true,
        isActive: true,
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          select: {
            batch: { select: { id: true, name: true, course: { select: { name: true } } } },
          },
        },
        _count: { select: { attendance: true, feeRecords: true } },
      },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateCutoff = thirtyDaysAgo.toISOString().split('T')[0];
    const ids = students.map((s) => s.id);
    if (ids.length === 0) return [];

    const [allAttendance, pendingFees] = await Promise.all([
      this.prisma.studentAttendance.findMany({
        where: { studentId: { in: ids }, dateISO: { gte: dateCutoff } },
        select: { studentId: true, present: true },
      }),
      this.prisma.feeRecord.groupBy({
        by: ['studentId'],
        where: { studentId: { in: ids }, paidAt: null },
        _count: true,
      }),
    ]);

    const attMap = new Map<string, { total: number; present: number }>();
    for (const row of allAttendance) {
      const cur = attMap.get(row.studentId) ?? { total: 0, present: 0 };
      cur.total += 1;
      if (row.present) cur.present += 1;
      attMap.set(row.studentId, cur);
    }
    const feeMap = new Map(pendingFees.map((g) => [g.studentId, g._count]));

    return students.map((s) => {
      const att = attMap.get(s.id);
      const attendancePct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
      const activeBatches = s.enrollments.map((e) => e.batch.name).join(', ') || s.batch;
      return {
        id: s.id,
        name: s.name,
        parentName: s.parentName,
        phone: s.phone,
        classGrade: s.classGrade,
        batch: activeBatches,
        course: s.course,
        admissionAt: s.admissionAt,
        isActive: s.isActive,
        attendancePct,
        pendingFees: feeMap.get(s.id) ?? 0,
        enrollments: s.enrollments,
      };
    });
  }

  async getStudent(businessId: string, id: string) {
    await this.requireCoaching(businessId);
    const s = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
        name: true,
        parentName: true,
        phone: true,
        classGrade: true,
        batch: true,
        course: true,
        admissionAt: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          orderBy: { enrollmentDate: 'desc' },
          select: {
            id: true,
            status: true,
            enrollmentDate: true,
            batch: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
                daysOfWeek: true,
                course: { select: { id: true, name: true, stream: { select: { id: true, name: true, key: true } } } },
              },
            },
          },
        },
        attendance: {
          orderBy: { dateISO: 'desc' },
          take: 120,
          select: { id: true, dateISO: true, present: true },
        },
        feeRecords: {
          orderBy: { dueDate: 'desc' },
          take: 48,
          select: {
            id: true,
            month: true,
            amountCents: true,
            paidAmountCents: true,
            dueDate: true,
            paidAt: true,
            notes: true,
            courseName: true,
            installmentIndex: true,
            installmentTotal: true,
            installmentGroupId: true,
          },
        },
      },
    });
    if (!s || s.businessId !== businessId) throw new BadRequestException('Student not found');
    const { businessId: _biz, ...rest } = s;
    return rest;
  }

  async createStudent(businessId: string, dto: CreateStudentDto) {
    await this.requireCoaching(businessId);
    const student = await this.prisma.student.create({
      data: {
        businessId,
        name: dto.name,
        parentName: dto.parentName,
        phone: dto.phone,
        classGrade: dto.classGrade,
        batch: dto.batch,
        course: dto.course,
      },
      select: { id: true, name: true, phone: true, batch: true, course: true },
    });

    if (dto.batchId) {
      await this.createEnrollment(businessId, { studentId: student.id, batchId: dto.batchId });
    }

    return student;
  }

  async updateStudent(businessId: string, id: string, dto: UpdateStudentDto) {
    await this.requireCoaching(businessId);
    const s = await this.prisma.student.findUnique({ where: { id }, select: { businessId: true } });
    if (!s || s.businessId !== businessId) throw new BadRequestException('Student not found');
    return this.prisma.student.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, phone: true, batch: true, course: true, isActive: true },
    });
  }

  async markAttendance(businessId: string, dto: MarkAttendanceDto) {
    await this.plans.assertFeature(businessId, 'attendance');
    const s = await this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { businessId: true } });
    if (!s || s.businessId !== businessId) throw new BadRequestException('Student not found');
    return this.prisma.studentAttendance.upsert({
      where: { studentId_dateISO: { studentId: dto.studentId, dateISO: dto.dateISO } },
      create: { studentId: dto.studentId, dateISO: dto.dateISO, present: dto.present },
      update: { present: dto.present },
      select: { id: true, dateISO: true, present: true },
    });
  }

  async bulkAttendance(
    businessId: string,
    dateISO: string,
    records: Array<{ studentId: string; present: boolean }>,
    batchId?: string,
  ) {
    await this.plans.assertFeature(businessId, 'attendance');
    const where: Prisma.StudentWhereInput = {
      businessId,
      id: { in: records.map((r) => r.studentId) },
    };
    if (batchId) where.batchId = batchId;

    const students = await this.prisma.student.findMany({
      where,
      select: { id: true },
    });
    const validIds = new Set(students.map((s) => s.id));
    const filtered = records.filter((r) => validIds.has(r.studentId));

    await Promise.all(
      filtered.map((r) =>
        this.prisma.studentAttendance.upsert({
          where: { studentId_dateISO: { studentId: r.studentId, dateISO } },
          create: { studentId: r.studentId, dateISO, present: r.present },
          update: { present: r.present },
        }),
      ),
    );
    return { marked: filtered.length };
  }

  async createFeeRecord(businessId: string, dto: CreateFeeRecordDto) {
    await this.plans.assertFeature(businessId, 'fee_tracking');
    const s = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { businessId: true, course: true },
    });
    if (!s || s.businessId !== businessId) throw new BadRequestException('Student not found');

    const installmentCount = dto.numberOfInstallments ?? 0;
    const dueDates = dto.dueDates ?? [];
    const totalAmount = dto.totalAmount ?? dto.amountCents;

    if (installmentCount > 0 && dueDates.length > 0) {
      if (dueDates.length !== installmentCount) {
        throw new BadRequestException('dueDates length must match numberOfInstallments');
      }
      if (!totalAmount || totalAmount <= 0) throw new BadRequestException('totalAmount required for installments');

      const groupId = randomUUID();
      const base = Math.floor(totalAmount / installmentCount);
      const remainder = totalAmount - base * installmentCount;
      const courseName = dto.courseName ?? s.course ?? undefined;

      const rows: Prisma.FeeRecordCreateManyInput[] = dueDates.map((dueDate, idx) => ({
        studentId: dto.studentId,
        businessId,
        amountCents: base + (idx === installmentCount - 1 ? remainder : 0),
        paidAmountCents: 0,
        dueDate: new Date(dueDate),
        month: dto.month,
        notes: dto.notes ?? `Installment ${idx + 1}/${installmentCount}`,
        courseName,
        installmentIndex: idx + 1,
        installmentTotal: installmentCount,
        installmentGroupId: groupId,
      }));

      await this.prisma.feeRecord.createMany({ data: rows });
      return { created: rows.length, installmentGroupId: groupId };
    }

    if (!totalAmount || !dto.dueDate) {
      throw new BadRequestException('amountCents and dueDate required for single fee');
    }

    return this.prisma.feeRecord.create({
      data: {
        studentId: dto.studentId,
        businessId,
        amountCents: totalAmount,
        paidAmountCents: 0,
        dueDate: new Date(dto.dueDate),
        month: dto.month,
        notes: dto.notes,
        courseName: dto.courseName ?? s.course ?? undefined,
      },
      select: { id: true, month: true, amountCents: true, dueDate: true, paidAt: true },
    });
  }

  async recordFeePayment(businessId: string, feeId: string, dto: RecordFeePaymentDto) {
    await this.plans.assertFeature(businessId, 'fee_tracking');
    const fee = await this.prisma.feeRecord.findUnique({
      where: { id: feeId },
      select: { businessId: true, paidAt: true, amountCents: true, paidAmountCents: true, notes: true },
    });
    if (!fee || fee.businessId !== businessId) throw new BadRequestException('Fee record not found');
    if (fee.paidAt) throw new BadRequestException('Fee already fully paid');

    const newPaid = fee.paidAmountCents + dto.paidAmountCents;
    const methodNote = dto.method ? `${dto.method}: ₹${Math.round(dto.paidAmountCents / 100)}` : null;
    const mergedNotes = [fee.notes, dto.notes, methodNote].filter(Boolean).join(' · ');

    if (newPaid >= fee.amountCents) {
      return this.prisma.feeRecord.update({
        where: { id: feeId },
        data: {
          paidAmountCents: fee.amountCents,
          paidAt: new Date(),
          isFullyPaid: true,
          paymentMode: dto.method === 'UPI' ? FeePaymentMode.UPI : FeePaymentMode.CASH,
          notes: mergedNotes || undefined,
        },
        select: { id: true, paidAmountCents: true, paidAt: true, amountCents: true, isFullyPaid: true },
      });
    }

    return this.prisma.feeRecord.update({
      where: { id: feeId },
      data: {
        paidAmountCents: newPaid,
        isFullyPaid: false,
        paymentMode: dto.method === 'UPI' ? FeePaymentMode.UPI : FeePaymentMode.CASH,
        notes: mergedNotes || undefined,
      },
      select: { id: true, paidAmountCents: true, paidAt: true, amountCents: true, isFullyPaid: true },
    });
  }

  async markFeePaid(businessId: string, feeId: string, paymentMode?: FeePaymentMode) {
    await this.plans.assertFeature(businessId, 'fee_tracking');
    const fee = await this.prisma.feeRecord.findUnique({
      where: { id: feeId },
      select: { businessId: true, paidAt: true, amountCents: true },
    });
    if (!fee || fee.businessId !== businessId) throw new BadRequestException('Fee record not found');
    return this.prisma.feeRecord.update({
      where: { id: feeId },
      data: {
        paidAt: new Date(),
        paidAmountCents: fee.amountCents,
        isFullyPaid: true,
        paymentMode: paymentMode ?? FeePaymentMode.CASH,
      },
      select: { id: true, month: true, paidAt: true, isFullyPaid: true },
    });
  }

  async updateFeeLedger(businessId: string, feeId: string, dto: UpdateFeeLedgerDto) {
    await this.plans.assertFeature(businessId, 'fee_tracking');
    const fee = await this.prisma.feeRecord.findUnique({
      where: { id: feeId },
      select: { businessId: true, amountCents: true, paidAmountCents: true },
    });
    if (!fee || fee.businessId !== businessId) throw new BadRequestException('Fee record not found');

    const paid = dto.amountPaid ?? fee.paidAmountCents;
    const fullyPaid = dto.isFullyPaid ?? paid >= fee.amountCents;

    return this.prisma.feeRecord.update({
      where: { id: feeId },
      data: {
        paidAmountCents: fullyPaid ? fee.amountCents : paid,
        isFullyPaid: fullyPaid,
        paidAt: fullyPaid ? new Date() : null,
        paymentMode: dto.paymentMode ?? undefined,
        month: dto.month ?? undefined,
      },
      select: {
        id: true,
        month: true,
        amountCents: true,
        paidAmountCents: true,
        isFullyPaid: true,
        paymentMode: true,
        paidAt: true,
      },
    });
  }

  async feesDashboard(businessId: string) {
    await this.plans.assertFeature(businessId, 'fee_tracking');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [totalStudents, pendingFees, overdueFeesCount, currentMonthFees] = await Promise.all([
      this.prisma.student.count({ where: { businessId, isActive: true } }),
      this.prisma.feeRecord.aggregate({
        where: { businessId, paidAt: null },
        _sum: { amountCents: true },
        _count: { id: true },
      }),
      this.prisma.feeRecord.count({
        where: { businessId, paidAt: null, dueDate: { lt: now } },
      }),
      this.prisma.feeRecord.aggregate({
        where: { businessId, month: currentMonth, paidAt: { not: null } },
        _sum: { amountCents: true },
        _count: { id: true },
      }),
    ]);

    const pendingFeesList = await this.prisma.feeRecord.findMany({
      where: { businessId, paidAt: null },
      orderBy: { dueDate: 'asc' },
      take: 30,
      select: {
        id: true,
        month: true,
        amountCents: true,
        paidAmountCents: true,
        dueDate: true,
        notes: true,
        courseName: true,
        installmentIndex: true,
        installmentTotal: true,
        student: { select: { id: true, name: true, phone: true, batch: true, course: true } },
      },
    });

    return {
      totalStudents,
      pendingAmount: pendingFees._sum.amountCents ?? 0,
      pendingCount: pendingFees._count.id,
      overdueCount: overdueFeesCount,
      currentMonthCollected: currentMonthFees._sum.amountCents ?? 0,
      currentMonthCount: currentMonthFees._count.id,
      pendingFeesList,
    };
  }

  async listBatches(businessId: string) {
    await this.requireCoaching(businessId);
    return this.prisma.batch.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        roomNumber: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        course: { select: { id: true, name: true, stream: { select: { id: true, name: true, key: true } } } },
        staffAssignments: {
          select: {
            staff: {
              select: { id: true, title: true, specializations: true, user: { select: { name: true } } },
            },
          },
        },
        _count: { select: { enrollments: { where: { status: EnrollmentStatus.ACTIVE } }, rosterStudents: { where: { status: StudentStatus.ACTIVE } } } },
      },
    });
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async directAddStudent(businessId: string, dto: DirectAddStudentDto) {
    await this.requireCoaching(businessId);
    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
      select: { businessId: true, name: true, feesAmountCents: true, course: { select: { name: true } } },
    });
    if (!batch || batch.businessId !== businessId) throw new BadRequestException('Batch not found');

    const parentPhone = dto.parentPhone ?? dto.phone ?? null;
    const student = await this.prisma.student.create({
      data: {
        businessId,
        name: dto.name.trim(),
        parentName: dto.parentName?.trim() || null,
        phone: dto.phone?.trim() || parentPhone,
        parentPhone,
        classGrade: dto.classGrade?.trim() || null,
        batchId: dto.batchId,
        batch: batch.name,
        course: batch.course.name,
        status: StudentStatus.ACTIVE,
        isActive: true,
      },
      select: { id: true, name: true, parentPhone: true, batchId: true },
    });

    await this.prisma.batchEnrollment.upsert({
      where: { studentId_batchId: { studentId: student.id, batchId: dto.batchId } },
      create: { studentId: student.id, batchId: dto.batchId, status: EnrollmentStatus.ACTIVE },
      update: { status: EnrollmentStatus.ACTIVE },
    });

    const month = this.currentMonth();
    if (batch.feesAmountCents && batch.feesAmountCents > 0) {
      const existing = await this.prisma.feeRecord.findFirst({
        where: { studentId: student.id, batchId: dto.batchId, month },
      });
      if (!existing) {
        const [y, m] = month.split('-').map(Number);
        const dueDate = new Date(y, m, 0);
        await this.prisma.feeRecord.create({
          data: {
            studentId: student.id,
            businessId,
            batchId: dto.batchId,
            amountCents: batch.feesAmountCents,
            paidAmountCents: 0,
            isFullyPaid: false,
            month,
            dueDate,
            courseName: batch.course.name,
          },
        });
      }
    }

    return student;
  }

  async getBatchOps(businessId: string, batchId: string) {
    await this.requireCoaching(businessId);
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        businessId: true,
        name: true,
        feesAmountCents: true,
        startDate: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        course: { select: { name: true, stream: { select: { name: true } } } },
      },
    });
    if (!batch || batch.businessId !== businessId) throw new BadRequestException('Batch not found');

    const month = this.currentMonth();
    const dateISO = new Date().toISOString().split('T')[0];

    const students = await this.prisma.student.findMany({
      where: { businessId, batchId, status: StudentStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        parentName: true,
        parentPhone: true,
        phone: true,
        classGrade: true,
        admissionAt: true,
        attendance: { where: { dateISO }, select: { present: true } },
        feeRecords: { where: { month, batchId }, select: { id: true, amountCents: true, paidAmountCents: true, isFullyPaid: true, paymentMode: true } },
        testResults: {
          orderBy: { test: { testDate: 'desc' } },
          take: 5,
          select: { marksObtained: true, test: { select: { subject: true, maxMarks: true, testDate: true } } },
        },
      },
    });

    const tests = await this.prisma.coachingTest.findMany({
      where: { batchId },
      orderBy: { testDate: 'desc' },
      take: 12,
      select: {
        id: true,
        subject: true,
        testDate: true,
        maxMarks: true,
        _count: { select: { results: true } },
      },
    });

    return {
      batch,
      month,
      dateISO,
      roster: students.map((s) => ({
        id: s.id,
        name: s.name,
        parentName: s.parentName,
        parentPhone: s.parentPhone ?? s.phone,
        classGrade: s.classGrade,
        admissionDate: s.admissionAt,
        presentToday: s.attendance[0]?.present ?? null,
        fee: s.feeRecords[0] ?? null,
        recentTests: s.testResults,
      })),
      tests,
    };
  }

  async createTest(businessId: string, dto: CreateCoachingTestDto) {
    await this.requireCoaching(businessId);
    const batch = await this.prisma.batch.findUnique({ where: { id: dto.batchId }, select: { businessId: true } });
    if (!batch || batch.businessId !== businessId) throw new BadRequestException('Batch not found');
    return this.prisma.coachingTest.create({
      data: {
        batchId: dto.batchId,
        subject: dto.subject.trim(),
        testDate: new Date(dto.testDate),
        maxMarks: dto.maxMarks,
      },
      select: { id: true, subject: true, testDate: true, maxMarks: true },
    });
  }

  async scoreBatchTest(businessId: string, dto: ScoreBatchTestDto) {
    await this.requireCoaching(businessId);
    const test = await this.prisma.coachingTest.findUnique({
      where: { id: dto.testId },
      select: { batch: { select: { businessId: true } }, maxMarks: true },
    });
    if (!test || test.batch.businessId !== businessId) throw new BadRequestException('Test not found');

    const studentIds = dto.scores.map((s) => s.studentId);
    const valid = await this.prisma.student.count({
      where: { businessId, id: { in: studentIds } },
    });
    if (valid !== studentIds.length) throw new BadRequestException('Invalid student in batch scores');

    await Promise.all(
      dto.scores.map((row) =>
        this.prisma.testResult.upsert({
          where: { testId_studentId: { testId: dto.testId, studentId: row.studentId } },
          create: {
            testId: dto.testId,
            studentId: row.studentId,
            marksObtained: Math.min(row.marksObtained, test.maxMarks),
            remarks: row.remarks?.trim() || null,
          },
          update: {
            marksObtained: Math.min(row.marksObtained, test.maxMarks),
            remarks: row.remarks?.trim() || null,
          },
        }),
      ),
    );
    return { scored: dto.scores.length };
  }

  async getBatchReport(businessId: string, batchId: string) {
    await this.requireCoaching(businessId);
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, businessId: true, name: true, feesAmountCents: true, course: { select: { name: true } } },
    });
    if (!batch || batch.businessId !== businessId) throw new BadRequestException('Batch not found');

    const month = this.currentMonth();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const roster = await this.prisma.student.findMany({
      where: { businessId, batchId, status: StudentStatus.ACTIVE },
      select: { id: true },
    });
    const studentIds = roster.map((s) => s.id);
    const rosterCount = studentIds.length;

    const [attendanceRows, feeRows, testRows] = await Promise.all([
      this.prisma.studentAttendance.findMany({
        where: { studentId: { in: studentIds }, dateISO: { gte: thirtyDaysAgo } },
        select: { present: true },
      }),
      this.prisma.feeRecord.findMany({
        where: { batchId, month },
        select: { amountCents: true, paidAmountCents: true, isFullyPaid: true },
      }),
      this.prisma.testResult.findMany({
        where: { studentId: { in: studentIds } },
        select: { marksObtained: true, test: { select: { maxMarks: true, subject: true, testDate: true } } },
      }),
    ]);

    const attTotal = attendanceRows.length;
    const attPresent = attendanceRows.filter((a) => a.present).length;
    const attendanceRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null;

    const totalDue = feeRows.reduce((s, f) => s + f.amountCents, 0);
    const totalPaid = feeRows.reduce((s, f) => s + f.paidAmountCents, 0);
    const feeCollectionPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : null;

    const testTrends = testRows.reduce<
      Record<string, { subject: string; date: string; avgPct: number; count: number }>
    >((acc, row) => {
      const key = row.test.testDate.toISOString().slice(0, 10);
      const pct = row.test.maxMarks > 0 ? (row.marksObtained / row.test.maxMarks) * 100 : 0;
      const cur = acc[key] ?? { subject: row.test.subject, date: key, avgPct: 0, count: 0 };
      cur.avgPct = (cur.avgPct * cur.count + pct) / (cur.count + 1);
      cur.count += 1;
      acc[key] = cur;
      return acc;
    }, {});

    const testTrendList = Object.values(testTrends)
      .map((t) => ({ ...t, avgPct: Math.round(t.avgPct) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const overallTestAvg =
      testRows.length > 0
        ? Math.round(
            testRows.reduce((s, r) => s + (r.test.maxMarks > 0 ? (r.marksObtained / r.test.maxMarks) * 100 : 0), 0) /
              testRows.length,
          )
        : null;

    return {
      batch: { id: batch.id, name: batch.name, courseName: batch.course.name, rosterCount },
      month,
      attendanceRate,
      feeCollectionPct,
      totalDue,
      totalPaid,
      pendingAmount: totalDue - totalPaid,
      overallTestAvg,
      testTrends: testTrendList,
    };
  }

  async getReportsOverview(businessId: string) {
    await this.requireCoaching(businessId);
    const batches = await this.prisma.batch.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, course: { select: { name: true } } },
    });

    const reports = await Promise.all(batches.map((b) => this.getBatchReport(businessId, b.id)));
    const month = this.currentMonth();

    const totalDue = reports.reduce((s, r) => s + r.totalDue, 0);
    const totalPaid = reports.reduce((s, r) => s + r.totalPaid, 0);
    const attendanceRates = reports.map((r) => r.attendanceRate).filter((v): v is number => v !== null);
    const avgAttendance =
      attendanceRates.length > 0
        ? Math.round(attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length)
        : null;

    return {
      month,
      batchCount: batches.length,
      totalDue,
      totalPaid,
      pendingAmount: totalDue - totalPaid,
      feeCollectionPct: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : null,
      avgAttendance,
      batches: reports,
    };
  }

  async getStudentReport(businessId: string, studentId: string) {
    await this.requireCoaching(businessId);
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        businessId: true,
        name: true,
        parentName: true,
        parentPhone: true,
        phone: true,
        classGrade: true,
        admissionAt: true,
        batchLink: { select: { id: true, name: true, course: { select: { name: true } } } },
        attendance: { orderBy: { dateISO: 'desc' }, take: 90, select: { dateISO: true, present: true } },
        feeRecords: { orderBy: { month: 'desc' }, take: 12, select: { month: true, amountCents: true, paidAmountCents: true, isFullyPaid: true, paymentMode: true } },
        testResults: {
          orderBy: { test: { testDate: 'desc' } },
          take: 20,
          select: {
            marksObtained: true,
            remarks: true,
            test: { select: { subject: true, maxMarks: true, testDate: true, batchId: true } },
          },
        },
      },
    });
    if (!student || student.businessId !== businessId) throw new BadRequestException('Student not found');

    const batchId = student.batchLink?.id;
    let classAvgPct: number | null = null;
    if (batchId) {
      const batchReport = await this.getBatchReport(businessId, batchId);
      classAvgPct = batchReport.overallTestAvg;
    }

    const attPresent = student.attendance.filter((a) => a.present).length;
    const attendancePct =
      student.attendance.length > 0 ? Math.round((attPresent / student.attendance.length) * 100) : null;

    const studentTestAvg =
      student.testResults.length > 0
        ? Math.round(
            student.testResults.reduce(
              (s, r) => s + (r.test.maxMarks > 0 ? (r.marksObtained / r.test.maxMarks) * 100 : 0),
              0,
            ) / student.testResults.length,
          )
        : null;

    const { businessId: _b, ...rest } = student;
    return {
      ...rest,
      parentPhone: rest.parentPhone ?? rest.phone,
      attendancePct,
      attendanceStreak: attPresent,
      studentTestAvg,
      classAvgPct,
      feeHistory: rest.feeRecords,
      testHistory: rest.testResults,
    };
  }

  async getBatchBroadcastRoster(businessId: string, batchId: string) {
    await this.requireCoaching(businessId);
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { businessId: true, name: true },
    });
    if (!batch || batch.businessId !== businessId) throw new BadRequestException('Batch not found');

    const students = await this.prisma.student.findMany({
      where: { businessId, batchId, status: StudentStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, parentPhone: true, phone: true, parentName: true },
    });

    return {
      batchName: batch.name,
      parents: students
        .filter((s) => s.parentPhone ?? s.phone)
        .map((s) => ({
          studentId: s.id,
          studentName: s.name,
          parentPhone: s.parentPhone ?? s.phone!,
          parentName: s.parentName,
        })),
    };
  }
}
