import { Injectable } from '@nestjs/common';
import { AppointmentStatus, LeadStage, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlots } from '../appointments/slot-engine';

type HubItem =
  | {
      type: 'lead';
      id: string;
      title: string;
      subtitle: string;
      status: LeadStage;
      suggestions: Array<{ key: string; label: string }>;
      updatedAt: string;
    }
  | {
      type: 'ticket';
      id: string;
      title: string;
      subtitle: string;
      status: TicketStatus;
      suggestions: Array<{ key: string; label: string }>;
      updatedAt: string;
      assignedToStaffId: string | null;
    };

@Injectable()
export class HubService {
  constructor(private prisma: PrismaService) {}

  private leadSuggestions(stage: LeadStage, hasPhone: boolean) {
    const s: Array<{ key: string; label: string }> = [];
    if (hasPhone) s.push({ key: 'wa', label: 'WhatsApp' });
    if (stage === 'NEW') s.push({ key: 'mark-interested', label: 'Interested' });
    if (stage === 'NEW' || stage === 'INTERESTED') s.push({ key: 'mark-followup', label: 'Follow up' });
    if (stage === 'FOLLOW_UP') s.push({ key: 'mark-converted', label: 'Converted' });
    return s.slice(0, 2);
  }

  private ticketSuggestions(status: TicketStatus, hasPhone: boolean) {
    const s: Array<{ key: string; label: string }> = [];
    if (hasPhone) s.push({ key: 'wa', label: 'WhatsApp' });
    if (status === 'OPEN') s.push({ key: 'in-progress', label: 'In progress' });
    if (status === 'IN_PROGRESS') s.push({ key: 'waiting', label: 'Waiting' });
    if (status !== 'RESOLVED' && status !== 'CLOSED') s.push({ key: 'resolve', label: 'Resolve' });
    return s.slice(0, 2);
  }

  async inbox(businessId: string) {
    const [leads, tickets] = await Promise.all([
      this.prisma.lead.findMany({
        where: { businessId },
        orderBy: { updatedAt: 'desc' },
        take: 25,
        select: { id: true, name: true, phone: true, stage: true, updatedAt: true, source: true },
      }),
      this.prisma.supportTicket.findMany({
        where: { businessId, status: { not: 'CLOSED' } },
        orderBy: { updatedAt: 'desc' },
        take: 25,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
          customer: { select: { phone: true, name: true } },
          assignedToStaffId: true,
        },
      }),
    ]);

    const items: HubItem[] = [
      ...leads.map((l) => ({
        type: 'lead' as const,
        id: l.id,
        title: l.name || l.phone || 'Lead',
        subtitle: `${l.phone ?? 'No phone'} • ${l.source}`,
        status: l.stage,
        suggestions: this.leadSuggestions(l.stage, Boolean(l.phone)),
        updatedAt: l.updatedAt.toISOString(),
      })),
      ...tickets.map((t) => ({
        type: 'ticket' as const,
        id: t.id,
        title: t.title,
        subtitle: `${t.customer?.phone ?? 'No phone'} • ${t.priority.charAt(0) + t.priority.slice(1).toLowerCase()}`,
        status: t.status,
        suggestions: this.ticketSuggestions(t.status, Boolean(t.customer?.phone)),
        updatedAt: t.updatedAt.toISOString(),
        assignedToStaffId: t.assignedToStaffId,
      })),
    ];

    items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

    return {
      items: items.slice(0, 40),
    };
  }

  async today(businessId: string) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const followupDueAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [leadsDue, apptsToday, ticketsOpen, paymentsPending] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          businessId,
          stage: { in: ['NEW', 'INTERESTED', 'FOLLOW_UP'] },
          updatedAt: { lt: followupDueAt },
        },
        orderBy: { updatedAt: 'asc' },
        take: 10,
        select: { id: true, name: true, phone: true, stage: true, updatedAt: true },
      }),
      this.prisma.appointment.findMany({
        where: { businessId, startAt: { gte: start, lte: end }, status: { in: ['PENDING', 'CONFIRMED'] } },
        orderBy: { startAt: 'asc' },
        take: 10,
        select: {
          id: true,
          startAt: true,
          status: true,
          customer: { select: { name: true, phone: true } },
          service: { select: { name: true } },
        },
      }),
      this.prisma.supportTicket.findMany({
        where: { businessId, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] } },
        orderBy: { updatedAt: 'asc' },
        take: 10,
        select: { id: true, title: true, status: true, updatedAt: true, customer: { select: { phone: true } } },
      }),
      this.prisma.payment.findMany({
        where: { businessId, verifiedAt: null },
        orderBy: { updatedAt: 'asc' },
        take: 10,
        select: {
          id: true,
          method: true,
          amountCents: true,
          updatedAt: true,
          appointment: { select: { customer: { select: { name: true, phone: true } } } },
        },
      }),
    ]);

    return {
      sections: [
        {
          key: 'followups',
          title: 'Follow-ups due',
          count: leadsDue.length,
          items: leadsDue.map((l) => ({
            id: l.id,
            title: l.name || l.phone || 'Lead',
            subtitle: `${l.phone ?? 'No phone'} • ${l.stage}`,
            action: l.phone ? { key: 'wa', label: 'WhatsApp' } : { key: 'open', label: 'Open' },
          })),
        },
        {
          key: 'today',
          title: 'Today’s bookings',
          count: apptsToday.length,
          items: apptsToday.map((a) => ({
            id: a.id,
            title: `${a.customer.name ?? 'Customer'} • ${a.service.name}`,
            subtitle: `${a.startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${a.status}`,
            action: { key: 'open', label: 'Open' },
          })),
        },
        {
          key: 'support',
          title: 'Support pending',
          count: ticketsOpen.length,
          items: ticketsOpen.map((t) => ({
            id: t.id,
            title: t.title,
            subtitle: `${t.customer?.phone ?? 'No phone'} • ${t.status}`,
            action: t.customer?.phone ? { key: 'wa', label: 'WhatsApp' } : { key: 'open', label: 'Open' },
          })),
        },
        {
          key: 'payments',
          title: 'Payments pending',
          count: paymentsPending.length,
          items: paymentsPending.map((p) => ({
            id: p.id,
            title: `${p.appointment.customer.name ?? 'Customer'} • ${p.method}`,
            subtitle: `${p.appointment.customer.phone ?? 'No phone'} • Pending verification`,
            action: p.appointment.customer.phone ? { key: 'wa', label: 'Remind' } : { key: 'open', label: 'Open' },
          })),
        },
      ],
    };
  }

  /**
   * Single payload for the mobile Hub: greeting context, stat strip, rule-based
   * suggestion, today’s schedule, and lightweight WhatsApp / ops signals.
   */
  async dashboard(businessId: string, userId: string) {
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const displayName =
      user?.name
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)[0] ?? 'there';

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const followupDueAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      appointmentsToday,
      revenueAgg,
      inactiveCustomerCount,
      pendingPaymentCount,
      needsReplyCount,
      firstService,
      followUpsDue,
      staffAvailable,
      noShowToday,
    ] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          businessId,
          startAt: { gte: start, lte: end },
          status: { not: AppointmentStatus.CANCELLED },
        },
        orderBy: { startAt: 'asc' },
        take: 48,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          customer: { select: { name: true, phone: true } },
          service: { select: { name: true } },
          staff: { select: { user: { select: { name: true } } } },
          payment: { select: { verifiedAt: true } },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          businessId,
          verifiedAt: { gte: start, lte: end },
        },
        _sum: { amountCents: true },
      }),
      this.prisma.customer.count({
        where: {
          businessId,
          appointments: {
            none: {
              startAt: { gte: thirtyDaysAgo },
              status: { not: AppointmentStatus.CANCELLED },
            },
          },
        },
      }),
      this.prisma.payment.count({
        where: { businessId, verifiedAt: null },
      }),
      this.prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int AS count FROM "Conversation"
        WHERE "businessId" = ${businessId}
          AND status = 'OPEN'
          AND "lastInboundAt" IS NOT NULL
          AND ("lastOutboundAt" IS NULL OR "lastInboundAt" > "lastOutboundAt")
      `.then((rows) => Number(rows[0]?.count ?? 0)),
      this.prisma.service.findFirst({
        where: { businessId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          durationMin: true,
          bufferBeforeMin: true,
          bufferAfterMin: true,
        },
      }),
      this.prisma.lead.count({
        where: {
          businessId,
          stage: { in: ['NEW', 'INTERESTED', 'FOLLOW_UP'] },
          updatedAt: { lt: followupDueAt },
        },
      }),
      this.prisma.staffProfile.count({
        where: { businessId, isAvailable: true },
      }),
      this.prisma.appointment.count({
        where: {
          businessId,
          startAt: { gte: start, lte: end },
          status: AppointmentStatus.NO_SHOW,
        },
      }),
    ]);

    const pendingConfirmations = appointmentsToday.filter((a) => a.status === AppointmentStatus.PENDING).length;

    let freeSlotsApprox: number | null = null;
    if (firstService && appointmentsToday.length < 40) {
      const existing = appointmentsToday.map((a) => ({
        startAt: a.startAt,
        endAt: a.endAt,
      }));
      freeSlotsApprox = generateSlots({
        date: start,
        service: firstService,
        existing,
        workStartHour: 9,
        workEndHour: 18,
        stepMin: 30,
      }).length;
    }

    const dateLabel = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });

    type Suggestion = {
      id: string;
      message: string;
      actionLabel: string;
      actionHref: string;
    };

    let suggestion: Suggestion | null = null;
    if (inactiveCustomerCount >= 3) {
      suggestion = {
        id: 'inactive_customers',
        message: `${inactiveCustomerCount} customers have not booked in the last 30 days. Send a friendly nudge on WhatsApp?`,
        actionLabel: 'View customers',
        actionHref: '/app/customers',
      };
    } else if (pendingConfirmations >= 2) {
      suggestion = {
        id: 'pending_confirmations',
        message: `${pendingConfirmations} bookings are still pending confirmation. Confirm them so customers know they are set.`,
        actionLabel: 'Open bookings',
        actionHref: '/app/bookings',
      };
    } else if (pendingPaymentCount > 0) {
      suggestion = {
        id: 'pending_payments',
        message: `${pendingPaymentCount} payment${pendingPaymentCount === 1 ? '' : 's'} waiting for verification.`,
        actionLabel: 'Review payments',
        actionHref: '/app/payments',
      };
    } else if (needsReplyCount > 0) {
      suggestion = {
        id: 'wa_reply',
        message: `${needsReplyCount} WhatsApp conversation${needsReplyCount === 1 ? '' : 's'} may need a reply.`,
        actionLabel: 'Open inbox',
        actionHref: '/app/inbox',
      };
    }

    const schedule = appointmentsToday.map((a) => ({
      id: a.id,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
      customerName: a.customer.name ?? 'Customer',
      phone: a.customer.phone,
      serviceName: a.service.name,
      staffName: a.staff?.user?.name ?? null,
      paymentPending: Boolean(a.payment && !a.payment.verifiedAt),
    }));

    return {
      displayName,
      dateLabel,
      stats: {
        bookingsToday: appointmentsToday.length,
        pendingConfirmations,
        revenueTodayCents: revenueAgg._sum.amountCents ?? 0,
        freeSlotsApprox,
        needsReplyCount,
        pendingPayments: pendingPaymentCount,
        followUpsDue,
        missedCustomers: inactiveCustomerCount,
        staffAvailable,
        noShowToday,
      },
      suggestion,
      schedule,
    };
  }

  async revenueLeakage(businessId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const followupDueAt = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [
      missedAppointments,
      pendingFollowups,
      inactiveCustomers,
      unansweredLeads,
      pendingPayments,
      pendingFeesAgg,
      avgServicePrice,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          businessId,
          startAt: { gte: thirtyDaysAgo },
          status: { in: [AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED] },
        },
      }),
      this.prisma.lead.count({
        where: {
          businessId,
          stage: { in: ['NEW', 'INTERESTED', 'FOLLOW_UP'] },
          updatedAt: { lt: followupDueAt },
        },
      }),
      this.prisma.customer.count({
        where: {
          businessId,
          appointments: {
            none: {
              startAt: { gte: thirtyDaysAgo },
              status: { not: AppointmentStatus.CANCELLED },
            },
          },
        },
      }),
      this.prisma.lead.count({
        where: { businessId, stage: 'NEW', updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.payment.count({ where: { businessId, verifiedAt: null } }),
      this.prisma.feeRecord.aggregate({
        where: { businessId, paidAt: null },
        _sum: { amountCents: true },
        _count: { id: true },
      }),
      this.prisma.service.aggregate({
        where: { businessId, isActive: true, priceCents: { gt: 0 } },
        _avg: { priceCents: true },
      }),
    ]);

    const avgPrice = avgServicePrice._avg.priceCents ?? 50000;
    const estimatedLossCents =
      missedAppointments * avgPrice +
      pendingFollowups * Math.round(avgPrice * 0.5) +
      inactiveCustomers * Math.round(avgPrice * 0.3) +
      (pendingFeesAgg._sum.amountCents ?? 0);

    return {
      missedAppointments,
      pendingFollowups,
      pendingFees: pendingFeesAgg._count.id,
      pendingFeesCents: pendingFeesAgg._sum.amountCents ?? 0,
      inactiveCustomers,
      unansweredLeads,
      pendingPayments,
      estimatedLossCents,
      actions: [
        ...(missedAppointments > 0
          ? [{ key: 'bookings', label: 'Review missed bookings', href: '/app/bookings?view=list&status=NO_SHOW' }]
          : []),
        ...(pendingFollowups > 0
          ? [{ key: 'followup', label: 'Complete follow-ups', href: '/app/leads' }]
          : []),
        ...(pendingFeesAgg._count.id > 0
          ? [{ key: 'fees', label: 'Collect pending fees', href: '/app/fees' }]
          : []),
        ...(inactiveCustomers > 0
          ? [{ key: 'customers', label: 'Contact missed customers', href: '/app/customers?filter=inactive' }]
          : []),
        ...(unansweredLeads > 0
          ? [{ key: 'leads', label: 'Reply to leads', href: '/app/leads' }]
          : []),
      ],
    };
  }

  async queue(businessId: string) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        businessId,
        startAt: { gte: start, lte: end },
        status: { not: AppointmentStatus.CANCELLED },
      },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { name: true, durationMin: true } },
        staff: { select: { user: { select: { name: true } } } },
      },
    });

    const mapRow = (a: (typeof appointments)[number]) => ({
      id: a.id,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
      customerName: a.customer.name ?? 'Patient',
      phone: a.customer.phone,
      serviceName: a.service.name,
      staffName: a.staff?.user?.name ?? null,
      durationMin: a.service.durationMin,
    });

    const completed = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED);
    const missed = appointments.filter((a) => a.status === AppointmentStatus.NO_SHOW);
    const waiting = appointments.filter(
      (a) =>
        (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED) &&
        a.startAt > now,
    );
    const current =
      appointments.find(
        (a) => a.status === AppointmentStatus.CONFIRMED && a.startAt <= now,
      ) ??
      appointments.find((a) => a.status === AppointmentStatus.CONFIRMED) ??
      null;

    const avgDuration =
      appointments.reduce((sum, a) => sum + (a.service.durationMin ?? 15), 0) /
      Math.max(1, waiting.length || appointments.length || 1);

    return {
      current: current ? mapRow(current) : null,
      waiting: waiting.map(mapRow),
      completed: completed.map(mapRow),
      missed: missed.map(mapRow),
      estimatedWaitMin: Math.round(waiting.length * avgDuration),
      counts: {
        waiting: waiting.length,
        completed: completed.length,
        missed: missed.length,
        total: appointments.length,
      },
    };
  }

  async clinicSnapshot(businessId: string) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const followupDueAt = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [patientsToday, noShowToday, followUpsDue, revenueAgg, waitingCount] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          businessId,
          startAt: { gte: start, lte: end },
          status: { not: AppointmentStatus.CANCELLED },
        },
      }),
      this.prisma.appointment.count({
        where: {
          businessId,
          startAt: { gte: start, lte: end },
          status: AppointmentStatus.NO_SHOW,
        },
      }),
      this.prisma.lead.count({
        where: {
          businessId,
          stage: { in: ['NEW', 'INTERESTED', 'FOLLOW_UP'] },
          updatedAt: { lt: followupDueAt },
        },
      }),
      this.prisma.payment.aggregate({
        where: { businessId, verifiedAt: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
      this.prisma.appointment.count({
        where: {
          businessId,
          startAt: { gt: now, lte: end },
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        },
      }),
    ]);

    return {
      patientsToday,
      noShowToday,
      followUpsDue,
      waitingCount,
      revenueTodayCents: revenueAgg._sum.amountCents ?? 0,
    };
  }

  async coachingSnapshot(businessId: string) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateISO = now.toISOString().split('T')[0];

    const [totalStudents, feesDue, feesDueCents, monthCollected, todayPresent, todayTotal] =
      await Promise.all([
        this.prisma.student.count({ where: { businessId, isActive: true } }),
        this.prisma.feeRecord.count({ where: { businessId, paidAt: null } }),
        this.prisma.feeRecord.aggregate({
          where: { businessId, paidAt: null },
          _sum: { amountCents: true },
        }),
        this.prisma.feeRecord.aggregate({
          where: { businessId, month: currentMonth, paidAt: { not: null } },
          _sum: { amountCents: true },
        }),
        this.prisma.studentAttendance.count({
          where: {
            dateISO,
            present: true,
            student: { businessId, isActive: true },
          },
        }),
        this.prisma.studentAttendance.count({
          where: { dateISO, student: { businessId, isActive: true } },
        }),
      ]);

    const recentAdmissions = await this.prisma.student.count({
      where: { businessId, admissionAt: { gte: thirtyDaysAgo } },
    });

    const attendancePct =
      todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : null;

    return {
      totalStudents,
      feesDue,
      feesDueCents: feesDueCents._sum.amountCents ?? 0,
      monthCollectedCents: monthCollected._sum.amountCents ?? 0,
      attendancePct,
      newAdmissions: recentAdmissions,
    };
  }

  async quickReplies(businessId: string) {
    return this.prisma.quickReply.findMany({
      where: { businessId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: { id: true, title: true, body: true, tags: true },
    });
  }

  async createLead(businessId: string, dto: { name?: string; phone?: string; notes?: string }) {
    return this.prisma.lead.create({
      data: {
        businessId,
        name: dto.name?.trim() || null,
        phone: dto.phone?.trim() || null,
        notes: dto.notes?.trim() || null,
        source: 'WHATSAPP',
        stage: 'NEW',
      },
      select: { id: true, stage: true, updatedAt: true },
    });
  }

  async createTicket(businessId: string, dto: { title: string; priority?: string; internalNotes?: string }) {
    return this.prisma.supportTicket.create({
      data: {
        businessId,
        title: dto.title,
        priority: dto.priority ?? 'NORMAL',
        internalNotes: dto.internalNotes?.trim() || null,
        lastMessageAt: new Date(),
      },
      select: { id: true, status: true, updatedAt: true },
    });
  }

  async health(businessId: string): Promise<{
    score: number;
    level: 'excellent' | 'good' | 'needs_attention' | 'critical';
    categoryKey: string | null;
    actions: Array<{ key: string; label: string; href: string }>;
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { category: { select: { key: true } } },
    });
    const categoryKey = business?.category?.key ?? null;

    const [
      totalAppts,
      completedAppts,
      noShowAppts,
      pendingPayments,
      waSession,
      overdueLeads,
      totalCustomers,
      repeatCustomers,
      staffTotal,
      staffAvailable,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { businessId, startAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.appointment.count({
        where: { businessId, startAt: { gte: thirtyDaysAgo }, status: { in: ['COMPLETED', 'CONFIRMED'] } },
      }),
      this.prisma.appointment.count({
        where: { businessId, startAt: { gte: thirtyDaysAgo }, status: 'NO_SHOW' },
      }),
      this.prisma.payment.count({ where: { businessId, verifiedAt: null } }),
      this.prisma.whatsAppSession.findUnique({ where: { businessId }, select: { status: true } }),
      this.prisma.lead.count({
        where: {
          businessId,
          stage: { in: ['NEW', 'INTERESTED', 'FOLLOW_UP'] },
          updatedAt: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.customer.count({ where: { businessId } }),
      this.prisma.customer.count({
        where: {
          businessId,
          appointments: {
            some: {
              startAt: { gte: thirtyDaysAgo },
              status: { in: ['COMPLETED', 'CONFIRMED'] },
            },
          },
        },
      }),
      this.prisma.staffProfile.count({ where: { businessId } }),
      this.prisma.staffProfile.count({ where: { businessId, isAvailable: true } }),
    ]);

    let score = 40;
    const actions: Array<{ key: string; label: string; href: string }> = [];

    // WhatsApp connectivity (+15)
    if (waSession?.status === 'CONNECTED') {
      score += 15;
    } else {
      actions.push({ key: 'wa', label: 'Reconnect WhatsApp', href: '/app/whatsapp' });
    }

    if (categoryKey === 'coaching') {
      const [totalStudents, pendingFees, paidFees, totalFees] = await Promise.all([
        this.prisma.student.count({ where: { businessId, isActive: true } }),
        this.prisma.feeRecord.count({ where: { businessId, paidAt: null } }),
        this.prisma.feeRecord.count({
          where: { businessId, paidAt: { not: null }, dueDate: { gte: thirtyDaysAgo } },
        }),
        this.prisma.feeRecord.count({ where: { businessId, dueDate: { gte: thirtyDaysAgo } } }),
      ]);
      const feeCollectionPct = totalFees > 0 ? paidFees / totalFees : 0.5;
      score += Math.round(feeCollectionPct * 25);
      if (totalStudents > 0) {
        const activeStudents = await this.prisma.student.count({
          where: {
            businessId,
            isActive: true,
            attendance: { some: { dateISO: { gte: thirtyDaysAgo.toISOString().split('T')[0] } } },
          },
        });
        score += Math.round((activeStudents / totalStudents) * 20);
      } else {
        score += 10;
      }
      if (pendingFees > 0)
        actions.push({ key: 'fees', label: 'Collect pending fees', href: '/app/fees' });
    } else if (categoryKey === 'clinic') {
      const attendanceRate = totalAppts > 0 ? (completedAppts - noShowAppts) / totalAppts : 0.5;
      score += Math.round(attendanceRate * 30);
      if (noShowAppts > 0)
        actions.push({ key: 'noshow', label: 'Follow up missed patients', href: '/app/customers?filter=inactive' });
      if (overdueLeads > 0)
        actions.push({ key: 'followup', label: 'Complete follow-ups', href: '/app/leads' });
    } else {
      // Salon / default
      const repeatPct = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;
      score += Math.round(repeatPct * 25);
      if (totalAppts > 0) {
        const utilization = staffTotal > 0 ? completedAppts / (staffTotal * 30) : completedAppts / 30;
        score += Math.min(15, Math.round(utilization * 15));
      }
      if (noShowAppts > 0)
        actions.push({ key: 'noshow', label: 'Contact missed customers', href: '/app/customers?filter=inactive' });
    }

    score -= Math.min(pendingPayments * 5, 15);
    score -= Math.min(overdueLeads * 3, 15);
    if (staffTotal > 0 && staffAvailable === 0) score -= 10;

    if (pendingPayments > 0)
      actions.push({ key: 'payments', label: 'Verify payments', href: '/app/payments' });
    if (overdueLeads > 0 && !actions.some((a) => a.key === 'followup'))
      actions.push({ key: 'followup', label: 'Improve follow-ups', href: '/app/leads' });

    score = Math.max(0, Math.min(100, score));
    const level =
      score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_attention' : 'critical';

    return { score, level, categoryKey, actions: actions.slice(0, 4) };
  }
}

