import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  BookingType,
  ClinicPaymentStatus,
  QueueStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  NextPatientDto,
  UpdateClinicPaymentDto,
  UpdateQueueStatusDto,
  WalkInRegisterDto,
} from './clinic.dto';

function dayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class ClinicService {
  constructor(private prisma: PrismaService) {}

  private async assertClinic(businessId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { category: { select: { key: true } } },
    });
    if (biz?.category?.key !== 'clinic') {
      throw new BadRequestException('Clinic module only available for clinic tenants');
    }
  }

  private mapRow(a: {
    id: string;
    tokenNumber: number | null;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    bookingType: BookingType;
    queueStatus: QueueStatus | null;
    paymentStatus: ClinicPaymentStatus;
    customer: { id: string; name: string | null; phone: string | null };
    service: { name: string; durationMin: number };
    staff: {
      id: string;
      title: string | null;
      user: { name: string | null };
    } | null;
  }) {
    return {
      id: a.id,
      tokenNumber: a.tokenNumber,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
      bookingType: a.bookingType,
      queueStatus: a.queueStatus,
      paymentStatus: a.paymentStatus,
      customerName: a.customer.name ?? 'Patient',
      customerId: a.customer.id,
      phone: a.customer.phone,
      serviceName: a.service.name,
      staffId: a.staff?.id ?? null,
      staffName: a.staff?.user?.name ?? null,
      doctorTitle: a.staff?.title ?? null,
      durationMin: a.service.durationMin,
    };
  }

  async getLiveQueue(businessId: string, staffId?: string) {
    await this.assertClinic(businessId);
    const { start, end } = dayBounds();

    const appointments = await this.prisma.appointment.findMany({
      where: {
        businessId,
        startAt: { gte: start, lte: end },
        status: { not: AppointmentStatus.CANCELLED },
        ...(staffId ? { staffId } : {}),
      },
      orderBy: [{ tokenNumber: 'asc' }, { startAt: 'asc' }],
      select: {
        id: true,
        tokenNumber: true,
        startAt: true,
        endAt: true,
        status: true,
        bookingType: true,
        queueStatus: true,
        paymentStatus: true,
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { name: true, durationMin: true } },
        staff: { select: { id: true, title: true, user: { select: { name: true } } } },
      },
    });

    const rows = appointments.map((a) => this.mapRow(a));
    const inConsultation = rows.find((r) => r.queueStatus === QueueStatus.IN_CONSULTATION) ?? null;
    const waiting = rows.filter((r) => r.queueStatus === QueueStatus.WAITING || (!r.queueStatus && r.status === AppointmentStatus.CONFIRMED));
    const completed = rows.filter((r) => r.queueStatus === QueueStatus.COMPLETED || r.status === AppointmentStatus.COMPLETED);
    const skipped = rows.filter((r) => r.queueStatus === QueueStatus.SKIPPED || r.status === AppointmentStatus.NO_SHOW);

    const upiCollected = rows.filter((r) => r.paymentStatus === ClinicPaymentStatus.PAID_UPI).length;

    const staffFees = await this.prisma.staffProfile.findMany({
      where: { businessId, isAvailable: true },
      select: {
        id: true,
        title: true,
        consultationFeeCents: true,
        user: { select: { name: true } },
      },
    });

    const paidRows = rows.filter(
      (r) => r.paymentStatus === ClinicPaymentStatus.PAID_CASH || r.paymentStatus === ClinicPaymentStatus.PAID_UPI,
    );
    let collectedCents = 0;
    for (const row of paidRows) {
      const staff = staffFees.find((s) => s.id === row.staffId);
      collectedCents += staff?.consultationFeeCents ?? 0;
    }

    return {
      current: inConsultation,
      waiting,
      completed,
      skipped,
      staff: staffFees.map((s) => ({
        id: s.id,
        name: s.user.name ?? 'Doctor',
        title: s.title,
        feeCents: s.consultationFeeCents,
      })),
      summary: {
        inConsultation: inConsultation ? 1 : 0,
        waiting: waiting.length,
        completed: completed.length,
        skipped: skipped.length,
        collectedCents,
        cashCount: rows.filter((r) => r.paymentStatus === ClinicPaymentStatus.PAID_CASH).length,
        upiCount: upiCollected,
      },
      currentVisibleToken: inConsultation?.tokenNumber ?? completed.at(-1)?.tokenNumber ?? null,
    };
  }

  private async nextToken(businessId: string, staffId: string, dayStart: Date, dayEnd: Date) {
    const max = await this.prisma.appointment.aggregate({
      where: {
        businessId,
        staffId,
        startAt: { gte: dayStart, lte: dayEnd },
        tokenNumber: { not: null },
      },
      _max: { tokenNumber: true },
    });
    return (max._max.tokenNumber ?? 0) + 1;
  }

  async registerWalkIn(businessId: string, dto: WalkInRegisterDto) {
    await this.assertClinic(businessId);
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: dto.staffId },
      select: { businessId: true, consultationDurationMin: true },
    });
    if (!staff || staff.businessId !== businessId) throw new BadRequestException('Doctor not found');

    let serviceDuration = 15;
    if (dto.serviceId) {
      const svc = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
        select: { businessId: true, durationMin: true },
      });
      if (!svc || svc.businessId !== businessId) throw new BadRequestException('Service not found');
      serviceDuration = svc.durationMin;
    } else {
      const svc = await this.prisma.service.findFirst({
        where: { businessId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { durationMin: true },
      });
      if (!svc) throw new BadRequestException('No active service configured');
      serviceDuration = svc.durationMin;
    }

    const phone = dto.phone.trim();
    const { start, end } = dayBounds();
    const tokenNumber = await this.nextToken(businessId, dto.staffId, start, end);
    const now = new Date();
    const endAt = new Date(now.getTime() + (staff.consultationDurationMin || serviceDuration || 15) * 60_000);

    return this.prisma.$transaction(async (tx) => {
      let customer = await tx.customer.findFirst({
        where: { businessId, phone },
        select: { id: true },
      });
      if (!customer) {
        customer = await tx.customer.create({
          data: { businessId, name: dto.name.trim(), phone },
          select: { id: true },
        });
      } else {
        await tx.customer.update({
          where: { id: customer.id },
          data: { name: dto.name.trim() },
        });
      }

      const serviceRow = await tx.service.findFirst({
        where: { businessId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (!serviceRow) throw new BadRequestException('No service');

      const appt = await tx.appointment.create({
        data: {
          businessId,
          customerId: customer.id,
          serviceId: dto.serviceId ?? serviceRow.id,
          staffId: dto.staffId,
          status: AppointmentStatus.CONFIRMED,
          startAt: now,
          endAt,
          tokenNumber,
          bookingType: BookingType.WALK_IN,
          queueStatus: QueueStatus.WAITING,
          paymentStatus: ClinicPaymentStatus.PENDING,
          source: 'APP',
        },
        select: {
          id: true,
          tokenNumber: true,
          startAt: true,
          queueStatus: true,
          customer: { select: { name: true, phone: true } },
        },
      });

      return {
        id: appt.id,
        tokenNumber: appt.tokenNumber,
        customerName: appt.customer.name,
        phone: appt.customer.phone,
        queueStatus: appt.queueStatus,
      };
    });
  }

  async advanceNextPatient(businessId: string, dto: NextPatientDto) {
    await this.assertClinic(businessId);
    const { start, end } = dayBounds();

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findFirst({
        where: {
          businessId,
          staffId: dto.staffId,
          startAt: { gte: start, lte: end },
          queueStatus: QueueStatus.IN_CONSULTATION,
        },
        orderBy: { tokenNumber: 'asc' },
      });

      if (current) {
        await tx.appointment.update({
          where: { id: current.id },
          data: { queueStatus: QueueStatus.COMPLETED, status: AppointmentStatus.COMPLETED },
        });
      }

      const next = await tx.appointment.findFirst({
        where: {
          businessId,
          staffId: dto.staffId,
          startAt: { gte: start, lte: end },
          queueStatus: QueueStatus.WAITING,
        },
        orderBy: { tokenNumber: 'asc' },
      });

      if (!next) {
        return { advanced: false, current: null, next: null };
      }

      const updated = await tx.appointment.update({
        where: { id: next.id },
        data: { queueStatus: QueueStatus.IN_CONSULTATION, status: AppointmentStatus.CONFIRMED },
        select: { id: true, tokenNumber: true },
      });

      return { advanced: true, current: updated, previousId: current?.id ?? null };
    });
  }

  async updateQueueStatus(businessId: string, appointmentId: string, dto: UpdateQueueStatusDto) {
    await this.assertClinic(businessId);
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { businessId: true },
    });
    if (!appt || appt.businessId !== businessId) throw new BadRequestException('Appointment not found');

    const statusPatch =
      dto.queueStatus === QueueStatus.COMPLETED
        ? { status: AppointmentStatus.COMPLETED }
        : dto.queueStatus === QueueStatus.SKIPPED
          ? { status: AppointmentStatus.NO_SHOW }
          : dto.queueStatus === QueueStatus.IN_CONSULTATION
            ? { status: AppointmentStatus.CONFIRMED }
            : {};

    if (dto.queueStatus === QueueStatus.IN_CONSULTATION) {
      const { start, end } = dayBounds();
      await this.prisma.appointment.updateMany({
        where: {
          businessId,
          staffId: (await this.prisma.appointment.findUnique({ where: { id: appointmentId }, select: { staffId: true } }))?.staffId ?? undefined,
          startAt: { gte: start, lte: end },
          queueStatus: QueueStatus.IN_CONSULTATION,
          id: { not: appointmentId },
        },
        data: { queueStatus: QueueStatus.WAITING },
      });
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { queueStatus: dto.queueStatus, ...statusPatch },
      select: { id: true, queueStatus: true, tokenNumber: true },
    });
  }

  async updatePaymentStatus(businessId: string, appointmentId: string, dto: UpdateClinicPaymentDto) {
    await this.assertClinic(businessId);
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { businessId: true },
    });
    if (!appt || appt.businessId !== businessId) throw new BadRequestException('Appointment not found');

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: dto.paymentStatus },
      select: { id: true, paymentStatus: true, tokenNumber: true },
    });
  }
}
