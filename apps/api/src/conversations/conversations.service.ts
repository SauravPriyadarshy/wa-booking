import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async list(businessId: string) {
    const convos = await this.prisma.conversation.findMany({
      where: { businessId },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
      select: {
        id: true,
        phone: true,
        name: true,
        status: true,
        labels: true,
        assignedToStaffId: true,
        lastMessageAt: true,
        lastInboundAt: true,
        lastOutboundAt: true,
      },
    });

    return convos.map((c) => ({
      ...c,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      lastInboundAt: c.lastInboundAt?.toISOString() ?? null,
      lastOutboundAt: c.lastOutboundAt?.toISOString() ?? null,
    }));
  }

  async messages(businessId: string, conversationId: string, cursor?: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, businessId: true },
    });
    if (!convo || convo.businessId !== businessId) throw new BadRequestException('Conversation not found');

    const take = 40;
    const rows = await this.prisma.message.findMany({
      where: { businessId, conversationId },
      orderBy: { receivedAt: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        direction: true,
        body: true,
        status: true,
        receivedAt: true,
        sentAt: true,
      },
    });

    const nextCursor = rows.length === take ? rows[rows.length - 1].id : null;

    return {
      items: rows.map((m) => ({
        ...m,
        receivedAt: m.receivedAt.toISOString(),
        sentAt: m.sentAt?.toISOString() ?? null,
      })),
      nextCursor,
    };
  }
}

