import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  list(businessId: string) {
    return this.prisma.customer.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, phone: true, notes: true, createdAt: true, updatedAt: true },
      take: 50,
    });
  }

  create(businessId: string, data: any) {
    return this.prisma.customer.create({
      data: { businessId, ...data },
      select: { id: true, name: true, phone: true, notes: true, createdAt: true, updatedAt: true },
    });
  }

  async update(businessId: string, id: string, data: any) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.businessId !== businessId)
      throw new BadRequestException('Customer not found');

    return this.prisma.customer.update({
      where: { id },
      data,
      select: { id: true, name: true, phone: true, notes: true, createdAt: true, updatedAt: true },
    });
  }

  async get(businessId: string, id: string) {
    const c = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true, businessId: true, name: true, phone: true, notes: true, createdAt: true, updatedAt: true },
    });
    if (!c || c.businessId !== businessId) throw new BadRequestException('Customer not found');
    const { businessId: _biz, ...rest } = c;
    return rest;
  }

  async timeline(businessId: string, customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, businessId: true, name: true, phone: true, createdAt: true },
    });
    if (!customer || customer.businessId !== businessId) throw new BadRequestException('Customer not found');

    const [appointments, tickets, leads, payments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { businessId, customerId },
        orderBy: { startAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          startAt: true,
          service: { select: { name: true } },
        },
      }),
      this.prisma.supportTicket.findMany({
        where: { businessId, customerId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      this.prisma.lead.findMany({
        where: { businessId, customerId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, stage: true, updatedAt: true, source: true },
      }),
      this.prisma.payment.findMany({
        where: { businessId, appointment: { customerId } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          method: true,
          amountCents: true,
          verifiedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const items = [
      ...appointments.map((a) => ({
        type: 'booking' as const,
        id: a.id,
        at: a.startAt.toISOString(),
        title: a.service.name,
        subtitle: `Status: ${a.status}`,
      })),
      ...tickets.map((t) => ({
        type: 'support' as const,
        id: t.id,
        at: t.updatedAt.toISOString(),
        title: t.title,
        subtitle: `Ticket: ${t.status}`,
      })),
      ...leads.map((l) => ({
        type: 'lead' as const,
        id: l.id,
        at: l.updatedAt.toISOString(),
        title: `Lead (${l.source})`,
        subtitle: `Stage: ${l.stage}`,
      })),
      ...payments.map((p) => ({
        type: 'payment' as const,
        id: p.id,
        at: p.updatedAt.toISOString(),
        title: `Payment (${p.method})`,
        subtitle: p.verifiedAt ? 'Verified' : 'Pending verification',
      })),
    ].sort((x, y) => (x.at < y.at ? 1 : -1));

    return {
      customer: { id: customer.id, name: customer.name, phone: customer.phone, createdAt: customer.createdAt },
      items: items.slice(0, 50),
    };
  }

  async findOrCreateByPhone(businessId: string, phone: string, name?: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { businessId, phone },
    });
    if (existing) {
      if (name && !existing.name) {
        return this.prisma.customer.update({
          where: { id: existing.id },
          data: { name },
        });
      }
      return existing;
    }
    return this.prisma.customer.create({
      data: { businessId, phone, name },
    });
  }
}

