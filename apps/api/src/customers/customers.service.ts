import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from '../plans/plans.service';

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  phone: true,
  notes: true,
  tags: true,
  birthday: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
  ) {}

  async list(businessId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      select: {
        ...CUSTOMER_SELECT,
        _count: { select: { appointments: true } },
      },
      take: 200,
    });

    const ids = customers.map((c) => c.id);
    if (ids.length === 0) return [];

    const [appointments, payments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          businessId,
          customerId: { in: ids },
          status: { in: ['COMPLETED', 'CONFIRMED'] },
        },
        orderBy: { startAt: 'desc' },
        select: {
          customerId: true,
          startAt: true,
          service: { select: { name: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          businessId,
          verifiedAt: { not: null },
          appointment: { customerId: { in: ids } },
        },
        select: { amountCents: true, appointment: { select: { customerId: true } } },
      }),
    ]);

    const lastByCustomer = new Map<string, (typeof appointments)[0]>();
    for (const appt of appointments) {
      if (!lastByCustomer.has(appt.customerId)) lastByCustomer.set(appt.customerId, appt);
    }

    const spendByCustomer = new Map<string, number>();
    for (const p of payments) {
      const cid = p.appointment.customerId;
      spendByCustomer.set(cid, (spendByCustomer.get(cid) ?? 0) + (p.amountCents ?? 0));
    }

    return customers.map((c) => {
      const last = lastByCustomer.get(c.id);
      return {
        ...c,
        totalVisits: c._count.appointments,
        lastVisitAt: last?.startAt?.toISOString() ?? null,
        lastService: last?.service?.name ?? null,
        totalSpendCents: spendByCustomer.get(c.id) ?? 0,
      };
    });
  }

  async create(businessId: string, data: any) {
    await this.plans.assertCanAddCustomer(businessId);
    return this.prisma.customer.create({
      data: {
        businessId,
        name: data.name,
        phone: data.phone,
        notes: data.notes,
        tags: data.tags ?? [],
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
      select: CUSTOMER_SELECT,
    });
  }

  async update(businessId: string, id: string, data: any) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.businessId !== businessId)
      throw new BadRequestException('Customer not found');

    return this.prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        notes: data.notes,
        tags: data.tags,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
      select: CUSTOMER_SELECT,
    });
  }

  async get(businessId: string, id: string) {
    const c = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
        name: true,
        phone: true,
        notes: true,
        tags: true,
        birthday: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!c || c.businessId !== businessId) throw new BadRequestException('Customer not found');

    const [totalVisits, spendAgg, preferredService, lastAppt] = await Promise.all([
      this.prisma.appointment.count({ where: { businessId, customerId: id, status: { in: ['COMPLETED', 'CONFIRMED'] } } }),
      this.prisma.payment.aggregate({
        where: { businessId, appointment: { customerId: id }, verifiedAt: { not: null } },
        _sum: { amountCents: true },
      }),
      this.prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { businessId, customerId: id, status: { in: ['COMPLETED', 'CONFIRMED'] } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      this.prisma.appointment.findFirst({
        where: { businessId, customerId: id, status: { in: ['COMPLETED', 'CONFIRMED'] } },
        orderBy: { startAt: 'desc' },
        select: { startAt: true },
      }),
    ]);

    let preferredServiceName: string | null = null;
    if (preferredService.length > 0) {
      const svc = await this.prisma.service.findUnique({ where: { id: preferredService[0].serviceId }, select: { name: true } });
      preferredServiceName = svc?.name ?? null;
    }

    const { businessId: _biz, ...rest } = c;
    return {
      ...rest,
      totalVisits,
      totalSpendCents: spendAgg._sum.amountCents ?? 0,
      preferredService: preferredServiceName,
      lastVisitAt: lastAppt?.startAt?.toISOString() ?? null,
    };
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
        select: { id: true, method: true, amountCents: true, verifiedAt: true, updatedAt: true },
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
    const existing = await this.prisma.customer.findFirst({ where: { businessId, phone } });
    if (existing) {
      if (name && !existing.name) {
        return this.prisma.customer.update({ where: { id: existing.id }, data: { name } });
      }
      return existing;
    }
    await this.plans.assertCanAddCustomer(businessId);
    return this.prisma.customer.create({ data: { businessId, phone, name } });
  }
}
