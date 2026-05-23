import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageDirection, MessageStatus } from '@prisma/client';

type WaIncomingMessageEvent = {
  type: 'message';
  businessId: string;
  waMessageId?: string;
  fromPhone?: string;
  fromName?: string;
  direction: 'IN' | 'OUT';
  body: string;
  timestampMs?: number;
};

@Injectable()
export class WaEventsService {
  constructor(
    private prisma: PrismaService,
    @Inject('QUEUE_REMINDERS') private remindersQueue: any,
  ) {}

  async ingest(secret: string | undefined, evt: WaIncomingMessageEvent) {
    const expected = process.env.WA_WORKER_SECRET;
    if (expected && secret !== expected) throw new UnauthorizedException('Invalid worker secret');
    if (!evt || evt.type !== 'message') throw new BadRequestException('Invalid event');
    if (!evt.businessId) throw new BadRequestException('businessId required');
    if (!evt.body?.trim()) throw new BadRequestException('body required');

    const phone = evt.fromPhone?.trim() || null;
    const name = evt.fromName?.trim() || null;
    const direction: MessageDirection = evt.direction === 'OUT' ? 'OUT' : 'IN';
    const receivedAt = evt.timestampMs ? new Date(evt.timestampMs) : new Date();

    let conversationId: string;

    if (phone) {
      const c = await this.prisma.conversation.upsert({
        where: { businessId_phone: { businessId: evt.businessId, phone } },
        create: {
          businessId: evt.businessId,
          phone,
          name,
          lastMessageAt: receivedAt,
          lastInboundAt: direction === 'IN' ? receivedAt : null,
          lastOutboundAt: direction === 'OUT' ? receivedAt : null,
        },
        update: {
          name: name ?? undefined,
          lastMessageAt: receivedAt,
          lastInboundAt: direction === 'IN' ? receivedAt : undefined,
          lastOutboundAt: direction === 'OUT' ? receivedAt : undefined,
        },
        select: { id: true },
      });
      conversationId = c.id;
    } else {
      const c = await this.prisma.conversation.create({
        data: {
          businessId: evt.businessId,
          phone: null,
          name,
          lastMessageAt: receivedAt,
          lastInboundAt: direction === 'IN' ? receivedAt : null,
          lastOutboundAt: direction === 'OUT' ? receivedAt : null,
        },
        select: { id: true },
      });
      conversationId = c.id;
    }

    await this.prisma.message.create({
      data: {
        businessId: evt.businessId,
        conversationId,
        waMessageId: evt.waMessageId ?? null,
        direction,
        body: evt.body,
        status: direction === 'IN' ? MessageStatus.RECEIVED : MessageStatus.SENT,
        sentAt: direction === 'OUT' ? receivedAt : null,
        receivedAt,
      },
      select: { id: true },
    });

    return { ok: true };
  }

  /**
   * Called by the wa-worker when the service provider replies CONFIRM/CANCEL {bookingId}
   * via WhatsApp. Updates appointment status and enqueues customer notification.
   */
  async handleBookingAction(
    secret: string | undefined,
    body: { appointmentId: string; action: 'CONFIRM' | 'CANCEL'; businessId: string },
  ) {
    const expected = process.env.WA_WORKER_SECRET;
    if (expected && secret !== expected) throw new UnauthorizedException('Invalid worker secret');

    const { appointmentId, action, businessId } = body;
    if (!appointmentId || !action || !businessId) throw new BadRequestException('appointmentId, action, businessId required');

    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true, businessId: true, status: true, startAt: true,
        customerId: true,
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
        business: { select: { name: true, slug: true } },
      },
    });

    if (!appt || appt.businessId !== businessId) throw new BadRequestException('Appointment not found');
    if (appt.status !== 'PENDING') return { ok: false, message: `Booking is already ${appt.status.toLowerCase()}` };

    const newStatus = action === 'CONFIRM' ? 'CONFIRMED' : 'CANCELLED';
    await this.prisma.appointment.update({ where: { id: appointmentId }, data: { status: newStatus } });

    // When confirmed, send customer the confirmation WhatsApp message
    if (action === 'CONFIRM' && appt.customer?.phone) {
      try {
        await this.remindersQueue.add(
          'booking_confirm',
          {
            appointmentId: appt.id,
            businessId,
            customerId: appt.customerId,
            customerName: appt.customer.name,
            customerPhone: appt.customer.phone,
            serviceName: appt.service.name,
            businessName: appt.business.name,
            bookingSlug: appt.business.slug,
            startAt: appt.startAt.toISOString(),
          },
          { jobId: `confirm:${appt.id}`, removeOnComplete: true },
        );
      } catch { /* non-fatal */ }
    }

    console.log(`[wa-events] Booking ${appointmentId} ${newStatus} via WhatsApp command`);
    return { ok: true, status: newStatus };
  }
}

