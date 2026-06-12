import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from '../plans/plans.service';
import type { CreateStudentDto, UpdateStudentDto, MarkAttendanceDto, CreateFeeRecordDto } from './coaching.dto';

@Injectable()
export class CoachingService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
  ) {}

  private async requireCoaching(businessId: string) {
    await this.plans.assertFeature(businessId, 'coaching_module');
  }

  async listStudents(businessId: string) {
    await this.requireCoaching(businessId);
    const students = await this.prisma.student.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, parentName: true, phone: true,
        classGrade: true, batch: true, course: true, admissionAt: true, isActive: true,
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
      const attendancePct =
        att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
      return { ...s, attendancePct, pendingFees: feeMap.get(s.id) ?? 0 };
    });
  }

  async getStudent(businessId: string, id: string) {
    await this.requireCoaching(businessId);
    const s = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true, businessId: true, name: true, parentName: true, phone: true,
        classGrade: true, batch: true, course: true, admissionAt: true, isActive: true, createdAt: true,
        attendance: { orderBy: { dateISO: 'desc' }, take: 60, select: { id: true, dateISO: true, present: true } },
        feeRecords: { orderBy: { dueDate: 'desc' }, take: 24, select: { id: true, month: true, amountCents: true, dueDate: true, paidAt: true, notes: true } },
      },
    });
    if (!s || s.businessId !== businessId) throw new BadRequestException('Student not found');
    const { businessId: _biz, ...rest } = s;
    return rest;
  }

  async createStudent(businessId: string, dto: CreateStudentDto) {
    await this.requireCoaching(businessId);
    return this.prisma.student.create({
      data: { businessId, ...dto },
      select: { id: true, name: true, phone: true, batch: true, course: true },
    });
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

  async bulkAttendance(businessId: string, dateISO: string, records: Array<{ studentId: string; present: boolean }>) {
    await this.plans.assertFeature(businessId, 'attendance');
    const students = await this.prisma.student.findMany({
      where: { businessId, id: { in: records.map((r) => r.studentId) } },
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
    const s = await this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { businessId: true } });
    if (!s || s.businessId !== businessId) throw new BadRequestException('Student not found');
    return this.prisma.feeRecord.create({
      data: {
        studentId: dto.studentId,
        businessId,
        amountCents: dto.amountCents,
        dueDate: new Date(dto.dueDate),
        month: dto.month,
        notes: dto.notes,
      },
      select: { id: true, month: true, amountCents: true, dueDate: true, paidAt: true },
    });
  }

  async markFeePaid(businessId: string, feeId: string) {
    await this.plans.assertFeature(businessId, 'fee_tracking');
    const fee = await this.prisma.feeRecord.findUnique({ where: { id: feeId }, select: { businessId: true, paidAt: true } });
    if (!fee || fee.businessId !== businessId) throw new BadRequestException('Fee record not found');
    return this.prisma.feeRecord.update({
      where: { id: feeId },
      data: { paidAt: new Date() },
      select: { id: true, month: true, paidAt: true },
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
      take: 20,
      select: {
        id: true, month: true, amountCents: true, dueDate: true, notes: true,
        student: { select: { id: true, name: true, phone: true, batch: true } },
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
}
