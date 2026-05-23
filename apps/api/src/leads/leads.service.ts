import { Injectable } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  list(businessId: string, stage?: LeadStage) {
    return this.prisma.lead.findMany({
      where: { businessId, ...(stage ? { stage } : {}) },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
        stage: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  create(businessId: string, dto: any) {
    return this.prisma.lead.create({
      data: {
        businessId,
        name: dto.name ?? null,
        phone: dto.phone ?? null,
        source: dto.source ?? 'WHATSAPP',
        notes: dto.notes ?? null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
        stage: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  setStage(businessId: string, id: string, stage: LeadStage, notes?: string) {
    return this.prisma.lead.update({
      where: { id, businessId },
      data: { stage, ...(notes !== undefined ? { notes } : {}) },
      select: { id: true, stage: true, notes: true, updatedAt: true },
    });
  }
}

