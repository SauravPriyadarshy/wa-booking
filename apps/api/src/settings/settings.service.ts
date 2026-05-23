import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HOLIDAY_APPOINTMENT_CANCEL_REASON } from '../common/holiday-cancel';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  getProfile(businessId: string) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, phone: true, slug: true, timezone: true, isActive: true },
    });
  }

  async updateProfile(
    businessId: string,
    data: { name?: string; phone?: string; slug?: string; timezone?: string },
  ) {
    if (data.slug) {
      const existing = await this.prisma.business.findUnique({ where: { slug: data.slug }, select: { id: true } });
      if (existing && existing.id !== businessId) throw new ConflictException('Slug already taken');
    }
    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
      },
      select: { id: true, name: true, phone: true, slug: true, timezone: true, isActive: true },
    });
  }

  listHours(businessId: string) {
    return this.prisma.businessHours.findMany({
      where: { businessId },
      orderBy: { weekday: 'asc' },
      select: { weekday: true, startMin: true, endMin: true, isClosed: true },
    });
  }

  setHours(
    businessId: string,
    args: { weekday: number; startMin: number; endMin: number; isClosed?: boolean },
  ) {
    return this.prisma.businessHours.upsert({
      where: { businessId_weekday: { businessId, weekday: args.weekday } },
      create: {
        businessId,
        weekday: args.weekday,
        startMin: args.startMin,
        endMin: args.endMin,
        isClosed: args.isClosed ?? false,
      },
      update: {
        startMin: args.startMin,
        endMin: args.endMin,
        isClosed: args.isClosed ?? false,
      },
      select: { weekday: true, startMin: true, endMin: true, isClosed: true },
    });
  }

  listHolidays(businessId: string) {
    return this.prisma.holiday.findMany({
      where: { businessId },
      orderBy: { dateISO: 'asc' },
      select: { id: true, dateISO: true, name: true },
      take: 400,
    });
  }

  addHoliday(
    businessId: string,
    args: { dateISO: string; name?: string; cancelAffectedBookings?: boolean },
  ) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(args.dateISO);
    if (!m) throw new BadRequestException('Invalid date');

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const start = new Date(y, mo - 1, d, 0, 0, 0, 0);
    const end = new Date(y, mo - 1, d, 23, 59, 59, 999);

    return this.prisma.$transaction(async (tx) => {
      const holiday = await tx.holiday.upsert({
        where: { businessId_dateISO: { businessId, dateISO: args.dateISO } },
        create: { businessId, dateISO: args.dateISO, name: args.name },
        update: { name: args.name },
        select: { id: true, dateISO: true, name: true },
      });

      let cancelled: {
        id: string;
        status: AppointmentStatus;
        startAt: Date;
        endAt: Date;
        customer: { id: string; name: string | null; phone: string | null };
        service: { id: string; name: string; durationMin: number };
      }[] = [];

      if (args.cancelAffectedBookings) {
        await tx.appointment.updateMany({
          where: {
            businessId,
            startAt: { lte: end },
            endAt: { gte: start },
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
          },
          data: {
            status: AppointmentStatus.CANCELLED,
            cancelReason: HOLIDAY_APPOINTMENT_CANCEL_REASON,
          },
        });

        cancelled = await tx.appointment.findMany({
          where: {
            businessId,
            startAt: { lte: end },
            endAt: { gte: start },
            status: AppointmentStatus.CANCELLED,
            cancelReason: HOLIDAY_APPOINTMENT_CANCEL_REASON,
          },
          orderBy: { startAt: 'asc' },
          select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            customer: { select: { id: true, name: true, phone: true } },
            service: { select: { id: true, name: true, durationMin: true } },
          },
        });
      }

      return { holiday, cancelled };
    });
  }
}

