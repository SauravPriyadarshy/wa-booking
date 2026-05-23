import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  getConfig(businessId: string) {
    return this.prisma.paymentConfig.findUnique({
      where: { businessId },
      select: { id: true, upiId: true, upiQrUrl: true, bankDetailsJson: true, allowCash: true },
    });
  }

  upsertConfig(businessId: string, dto: any) {
    return this.prisma.paymentConfig.upsert({
      where: { businessId },
      create: {
        businessId,
        upiId: dto.upiId ?? null,
        upiQrUrl: dto.upiQrUrl ?? null,
        bankDetailsJson: dto.bankDetailsJson ?? null,
        allowCash: dto.allowCash ?? true,
      },
      update: {
        upiId: dto.upiId ?? null,
        upiQrUrl: dto.upiQrUrl ?? null,
        bankDetailsJson: dto.bankDetailsJson ?? null,
        allowCash: dto.allowCash ?? true,
      },
      select: { id: true, upiId: true, upiQrUrl: true, bankDetailsJson: true, allowCash: true },
    });
  }

  async createPayment(businessId: string, dto: any) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      select: { id: true, businessId: true },
    });
    if (!appt || appt.businessId !== businessId) throw new BadRequestException('Booking not found');

    const existing = await this.prisma.payment.findUnique({ where: { appointmentId: dto.appointmentId } });
    if (existing) throw new BadRequestException('Payment already created');

    return this.prisma.payment.create({
      data: {
        businessId,
        appointmentId: dto.appointmentId,
        method: dto.method,
        amountCents: dto.amountCents ?? null,
        proofUrl: dto.proofUrl ?? null,
      },
      select: { id: true, method: true, amountCents: true, proofUrl: true, verifiedAt: true, createdAt: true },
    });
  }

  verify(businessId: string, id: string) {
    return this.prisma.payment.update({
      where: { id, businessId },
      data: { verifiedAt: new Date() },
      select: { id: true, verifiedAt: true },
    });
  }

  pending(businessId: string) {
    return this.prisma.payment.findMany({
      where: { businessId, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        method: true,
        amountCents: true,
        proofUrl: true,
        createdAt: true,
        appointment: {
          select: {
            id: true,
            startAt: true,
            status: true,
            customer: { select: { name: true, phone: true } },
            service: { select: { name: true } },
          },
        },
      },
    });
  }
}

