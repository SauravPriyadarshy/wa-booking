import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  list(businessId: string, status?: TicketStatus) {
    return this.prisma.supportTicket.findMany({
      where: { businessId, ...(status ? { status } : {}) },
      orderBy: [{ updatedAt: 'desc' }],
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        internalNotes: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  async create(businessId: string, dto: any) {
    if (dto.customerId) {
      const c = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!c || c.businessId !== businessId) throw new BadRequestException('Customer not found');
    }

    return this.prisma.supportTicket.create({
      data: {
        businessId,
        customerId: dto.customerId ?? null,
        title: dto.title,
        priority: dto.priority ?? 'NORMAL',
        internalNotes: dto.internalNotes ?? null,
        lastMessageAt: new Date(),
      },
      select: { id: true, title: true, status: true, priority: true, createdAt: true },
    });
  }

  async setStatus(businessId: string, id: string, status: TicketStatus) {
    return this.prisma.supportTicket.update({
      where: { id, businessId },
      data: { status, lastMessageAt: new Date() },
      select: { id: true, status: true, updatedAt: true },
    });
  }

  async addNote(businessId: string, id: string, internalNotes: string) {
    return this.prisma.supportTicket.update({
      where: { id, businessId },
      data: { internalNotes, lastMessageAt: new Date() },
      select: { id: true, updatedAt: true },
    });
  }

  async assign(businessId: string, id: string, assignedToStaffId: string | null) {
    if (assignedToStaffId) {
      const staff = await this.prisma.staffProfile.findUnique({
        where: { id: assignedToStaffId },
        select: { id: true, businessId: true },
      });
      if (!staff || staff.businessId !== businessId) throw new BadRequestException('Staff not found');
    }

    return this.prisma.supportTicket.update({
      where: { id, businessId },
      data: { assignedToStaffId, lastMessageAt: new Date() },
      select: { id: true, assignedToStaffId: true, updatedAt: true },
    });
  }
}

