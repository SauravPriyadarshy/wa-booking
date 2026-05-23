import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async summary(businessId: string) {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);

    const [todayBookings, last30Total, last30NoShow, repeatCustomers, verifiedRevenue] = await Promise.all([
      this.prisma.appointment.count({
        where: { businessId, startAt: { gte: startOfToday, lte: endOfToday }, status: { not: AppointmentStatus.CANCELLED } },
      }),
      this.prisma.appointment.count({
        where: { businessId, startAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, status: { not: AppointmentStatus.CANCELLED } },
      }),
      this.prisma.appointment.count({
        where: { businessId, startAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, status: AppointmentStatus.NO_SHOW },
      }),
      this.prisma.customer.count({
        where: { businessId, appointments: { some: {} } },
      }),
      this.prisma.payment.aggregate({
        where: { businessId, verifiedAt: { not: null } },
        _sum: { amountCents: true },
      }),
    ]);

    return {
      ok: true,
      todayBookings,
      last30: {
        total: last30Total,
        noShow: last30NoShow,
        noShowRate: last30Total > 0 ? last30NoShow / last30Total : 0,
      },
      repeatCustomers,
      verifiedRevenueCents: verifiedRevenue._sum.amountCents ?? 0,
    };
  }

  /**
   * Date-range analytics: daily booking counts + daily revenue for charts.
   * startDate / endDate: ISO date strings (YYYY-MM-DD). Defaults to last 30 days.
   */
  async dateRange(businessId: string, startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        businessId,
        startAt: { gte: start, lte: end },
        status: { not: AppointmentStatus.CANCELLED },
      },
      select: { startAt: true, status: true, payment: { select: { amountCents: true, verifiedAt: true } } },
    });

    // Aggregate by ISO date
    const byDate: Record<string, { bookings: number; revenueCents: number }> = {};
    for (const appt of appointments) {
      const key = appt.startAt.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { bookings: 0, revenueCents: 0 };
      byDate[key].bookings++;
      if (appt.payment?.verifiedAt) {
        byDate[key].revenueCents += appt.payment.amountCents ?? 0;
      }
    }

    const daily = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    return { ok: true, start: start.toISOString(), end: end.toISOString(), daily };
  }

  /** Top services by booking count in the last N days (default 30). */
  async topServices(businessId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: { businessId, startAt: { gte: since }, status: { not: AppointmentStatus.CANCELLED } },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 10,
    });

    const serviceIds = rows.map((r) => r.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });
    const nameMap = Object.fromEntries(services.map((s) => [s.id, s.name]));

    return {
      ok: true,
      days,
      topServices: rows.map((r) => ({
        serviceId: r.serviceId,
        name: nameMap[r.serviceId] ?? 'Unknown',
        bookings: r._count.serviceId,
      })),
    };
  }

  /** Revenue by day for the last N days, including unverified estimates. */
  async revenueByDay(businessId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const payments = await this.prisma.payment.findMany({
      where: { businessId, createdAt: { gte: since } },
      select: { amountCents: true, verifiedAt: true, createdAt: true },
    });

    const byDate: Record<string, { verified: number; total: number }> = {};
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { verified: 0, total: 0 };
      byDate[key].total += p.amountCents ?? 0;
      if (p.verifiedAt) byDate[key].verified += p.amountCents ?? 0;
    }

    const daily = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    return { ok: true, daily };
  }
}
