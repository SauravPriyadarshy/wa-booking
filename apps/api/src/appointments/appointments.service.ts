import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import type IORedis from 'ioredis';
import { generateSlots } from './slot-engine';
import { HOLIDAY_APPOINTMENT_CANCEL_REASON } from '../common/holiday-cancel';

const SLOT_LOCK_TTL_MS = 8_000; // 8s lock per slot attempt

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS') private redis: IORedis,
    @Inject('QUEUE_REMINDERS') private remindersQueue: any,
  ) {}

  listUpcoming(businessId: string) {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: { businessId, endAt: { gte: now } },
      orderBy: { startAt: 'asc' },
      take: 50,
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
        source: true,
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, durationMin: true } },
        staff: { select: { user: { select: { name: true } } } },
      },
    });
  }

  /**
   * Calendar day view: business hours for that weekday + all non-cancelled
   * appointments overlapping the local calendar day.
   */
  async listForDay(businessId: string, dateISO: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
    if (!m) throw new BadRequestException('Invalid date');

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const start = new Date(y, mo - 1, d, 0, 0, 0, 0);
    const end = new Date(y, mo - 1, d, 23, 59, 59, 999);
    const weekday = start.getDay();

    const holiday = await this.prisma.holiday.findUnique({
      where: { businessId_dateISO: { businessId, dateISO } },
      select: { id: true },
    });
    if (holiday) {
      const appointments = await this.prisma.appointment.findMany({
        where: {
          businessId,
          startAt: { lte: end },
          endAt: { gte: start },
          OR: [
            { status: { not: AppointmentStatus.CANCELLED } },
            { status: AppointmentStatus.CANCELLED, cancelReason: HOLIDAY_APPOINTMENT_CANCEL_REASON },
          ],
        },
        orderBy: { startAt: 'asc' },
        select: {
          id: true, status: true, startAt: true, endAt: true, cancelReason: true, source: true,
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true, durationMin: true } },
          staff: { select: { user: { select: { name: true } } } },
        },
      });
      return { date: dateISO, isHoliday: true, hours: { isClosed: true, startMin: 0, endMin: 0 }, appointments };
    }

    const [hours, appointments] = await Promise.all([
      this.prisma.businessHours.findUnique({
        where: { businessId_weekday: { businessId, weekday } },
        select: { isClosed: true, startMin: true, endMin: true },
      }),
      this.prisma.appointment.findMany({
        where: {
          businessId,
          startAt: { lte: end },
          endAt: { gte: start },
          status: { not: AppointmentStatus.CANCELLED },
        },
        orderBy: { startAt: 'asc' },
        select: {
          id: true, status: true, startAt: true, endAt: true, cancelReason: true, source: true,
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true, durationMin: true } },
          staff: { select: { user: { select: { name: true } } } },
        },
      }),
    ]);

    const h = hours ?? { isClosed: false, startMin: 540, endMin: 1080 };
    return {
      date: dateISO,
      isHoliday: false,
      hours: { isClosed: Boolean(h.isClosed), startMin: h.startMin ?? 540, endMin: h.endMin ?? 1080 },
      appointments,
    };
  }

  /**
   * Atomic booking: Redis slot lock → Prisma transaction conflict check + create.
   * Prevents double-booking under concurrent requests.
   */
  async create(businessId: string, dto: { customerId: string; serviceId: string; staffId?: string; startAt: string }) {
    const [service, customer, business] = await Promise.all([
      this.prisma.service.findUnique({ where: { id: dto.serviceId } }),
      this.prisma.customer.findUnique({ where: { id: dto.customerId }, select: { id: true, businessId: true, name: true, phone: true } }),
      this.prisma.business.findUnique({ where: { id: businessId }, select: { id: true, name: true, phone: true, slug: true } }),
    ]);
    if (!service || service.businessId !== businessId) throw new BadRequestException('Service not found');
    if (!customer || customer.businessId !== businessId) throw new BadRequestException('Customer not found');

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime())) throw new BadRequestException('Invalid startAt');
    const dur = service.durationMin + (service.bufferBeforeMin ?? 0) + (service.bufferAfterMin ?? 0);
    const endAt = new Date(startAt.getTime() + dur * 60_000);

    // Auto-assign staff if not provided: pick first available with no conflict
    let staffId = dto.staffId;
    if (!staffId) {
      const staffList = await this.prisma.staffProfile.findMany({
        where: { businessId, isAvailable: true },
        select: { id: true },
        take: 25,
      });
      for (const s of staffList) {
        const conflict = await this.prisma.appointment.findFirst({
          where: {
            businessId, staffId: s.id,
            startAt: { lt: endAt }, endAt: { gt: startAt },
            status: { not: AppointmentStatus.CANCELLED },
          },
          select: { id: true },
        });
        if (!conflict) { staffId = s.id; break; }
      }
    }

    // Acquire Redis slot lock to prevent concurrent double-booking
    const lockKey = `slot-lock:${businessId}:${staffId ?? 'any'}:${startAt.toISOString()}`;
    let redisAvailable = false;
    let lockAcquired = false;
    try {
      const result = await this.redis.set(lockKey, '1', 'PX', SLOT_LOCK_TTL_MS, 'NX');
      redisAvailable = true;
      lockAcquired = result === 'OK';
    } catch {
      // Redis unavailable — proceed without lock; DB transaction still prevents duplicates
    }

    // Only reject if Redis was reachable but the slot is already locked by another request
    if (redisAvailable && !lockAcquired) {
      throw new ConflictException('This slot is being booked by another request. Please try again.');
    }

    try {
      // Prisma interactive transaction: conflict check + create are atomic
      const appointment = await this.prisma.$transaction(async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            businessId,
            ...(staffId ? { staffId } : {}),
            startAt: { lt: endAt },
            endAt: { gt: startAt },
            status: { not: AppointmentStatus.CANCELLED },
          },
          select: { id: true },
        });
        if (conflict) throw new ConflictException('Slot not available');

        return tx.appointment.create({
          data: {
            businessId,
            customerId: dto.customerId,
            serviceId: dto.serviceId,
            staffId,
            startAt,
            endAt,
            status: AppointmentStatus.PENDING,
            source: 'APP',
          },
          select: { id: true, status: true, startAt: true, endAt: true },
        });
      });

      const commonJobData = {
        appointmentId: appointment.id,
        businessId,
        customerId: dto.customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        serviceName: service.name,
        businessName: business?.name ?? '',
        businessPhone: business?.phone ?? null,
        bookingSlug: business?.slug ?? '',
        startAt: appointment.startAt.toISOString(),
      };

      // Immediate WhatsApp notification to customer (booking received, pending confirmation)
      try {
        await this.remindersQueue.add(
          'booking_new_customer',
          commonJobData,
          { jobId: `booking_new_customer:${appointment.id}`, removeOnComplete: true },
        );
      } catch { /* non-fatal */ }

      // Immediate WhatsApp notification to provider (new booking alert + confirm/cancel instructions)
      if (business?.phone) {
        try {
          await this.remindersQueue.add(
            'booking_new_provider',
            commonJobData,
            { jobId: `booking_new_provider:${appointment.id}`, removeOnComplete: true },
          );
        } catch { /* non-fatal */ }
      }

      // Enqueue 24h reminder (delay = startAt - 24h - now, min 0)
      const reminderDelay = Math.max(0, startAt.getTime() - Date.now() - 24 * 60 * 60 * 1000);
      try {
        await this.remindersQueue.add(
          'reminder_24h',
          { appointmentId: appointment.id, businessId, customerId: dto.customerId, serviceId: dto.serviceId },
          { delay: reminderDelay, jobId: `reminder_24h:${appointment.id}`, removeOnComplete: true },
        );
      } catch { /* non-fatal */ }

      return appointment;
    } finally {
      if (redisAvailable) {
        try { await this.redis.del(lockKey); } catch { /* ignore */ }
      }
    }
  }

  async updateStatus(businessId: string, id: string, status: AppointmentStatus) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing || existing.businessId !== businessId)
      throw new BadRequestException('Booking not found');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      select: {
        id: true, status: true, startAt: true, endAt: true,
        customerId: true, serviceId: true, businessId: true,
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
        business: { select: { name: true, slug: true } },
      },
    });

    // On CONFIRMED: enqueue booking confirmation WhatsApp message
    if (status === AppointmentStatus.CONFIRMED) {
      try {
        await this.remindersQueue.add(
          'booking_confirm',
          {
            appointmentId: id, businessId,
            customerId: updated.customerId,
            customerName: updated.customer.name,
            customerPhone: updated.customer?.phone,
            serviceName: updated.service.name,
            businessName: updated.business.name,
            bookingSlug: updated.business.slug,
            startAt: updated.startAt.toISOString(),
          },
          { jobId: `confirm:${id}`, removeOnComplete: true },
        );
      } catch { /* non-fatal */ }
    }

    // On COMPLETED: enqueue post-visit follow-up (24h later)
    if (status === AppointmentStatus.COMPLETED) {
      try {
        await this.remindersQueue.add(
          'post_visit',
          {
            appointmentId: id, businessId,
            customerId: updated.customerId,
            customerName: updated.customer.name,
            customerPhone: updated.customer?.phone,
            serviceName: updated.service.name,
            businessName: updated.business.name,
            bookingSlug: updated.business.slug,
          },
          { delay: 24 * 60 * 60 * 1000, jobId: `post_visit:${id}`, removeOnComplete: true },
        );
      } catch { /* non-fatal */ }
    }

    return { id: updated.id, status: updated.status, startAt: updated.startAt, endAt: updated.endAt };
  }

  async slots(businessId: string, serviceId: string, dateISO: string, staffId?: string) {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.businessId !== businessId) throw new BadRequestException('Service not found');

    const date = new Date(dateISO);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');
    date.setHours(0, 0, 0, 0);

    const holiday = await this.prisma.holiday.findUnique({
      where: { businessId_dateISO: { businessId, dateISO } },
      select: { id: true },
    });
    if (holiday) return [];

    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    const existing = await this.prisma.appointment.findMany({
      where: {
        businessId,
        ...(staffId ? { staffId } : {}),
        startAt: { lte: dayEnd },
        endAt: { gte: dayStart },
        status: { not: AppointmentStatus.CANCELLED },
      },
      select: { startAt: true, endAt: true },
    });

    const weekday = new Date(date).getDay();
    const hours = await this.prisma.businessHours.findUnique({
      where: { businessId_weekday: { businessId, weekday } },
      select: { isClosed: true, startMin: true, endMin: true },
    });

    if (hours?.isClosed) return [];

    const workStartHour = Math.floor((hours?.startMin ?? 540) / 60);
    const workEndHour = Math.floor((hours?.endMin ?? 1080) / 60);

    return generateSlots({ date, service, existing, workStartHour, workEndHour, stepMin: 15 })
      .map((s) => ({ ...s, staffId: staffId ?? null }));
  }
}
