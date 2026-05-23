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

    const [
      appointmentsToday,
      revenueAgg,
      inactiveCustomerCount,
      pendingPaymentCount,
      conversationsOpen,
      firstService,
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
      this.prisma.conversation.findMany({
        where: {
          businessId,
          status: 'OPEN',
          lastInboundAt: { not: null },
        },
        select: { lastInboundAt: true, lastOutboundAt: true },
      }),
      this.prisma.service.findFirst({
        where: { businessId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          durationMin: true,
          bufferBeforeMin: true,
          bufferAfterMin: true,
        },
      }),
    ]);

    const needsReplyCount = conversationsOpen.filter((c) => {
      if (!c.lastInboundAt) return false;
      if (!c.lastOutboundAt) return true;
      return c.lastInboundAt > c.lastOutboundAt;
    }).length;

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
      },
      suggestion,
      schedule,
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
}

