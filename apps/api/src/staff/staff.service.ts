import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
  ) {}

  list(businessId: string) {
    return this.prisma.staffProfile.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        specialization: true,
        consultationFeeCents: true,
        consultationDurationMin: true,
        isAvailable: true,
        user: { select: { id: true, name: true } },
        hours: {
          orderBy: { weekday: 'asc' },
          select: { weekday: true, startMin: true, endMin: true, isOff: true },
        },
      },
    });
  }

  async create(
    businessId: string,
    args: {
      name: string;
      title?: string;
      specialization?: string;
      consultationFeeCents?: number;
      consultationDurationMin?: number;
    },
  ) {
    await this.plans.assertCanAddStaff(businessId);
    const user = await this.prisma.user.create({
      data: {
        name: args.name,
        role: 'STAFF',
        businessId,
      },
      select: { id: true, name: true },
    });

    const staff = await this.prisma.staffProfile.create({
      data: {
        businessId,
        userId: user.id,
        title: args.title,
        specialization: args.specialization ?? args.title,
        consultationFeeCents: args.consultationFeeCents,
        consultationDurationMin: args.consultationDurationMin ?? 15,
        isAvailable: true,
      },
      select: { id: true, isAvailable: true, title: true, specialization: true, consultationFeeCents: true, consultationDurationMin: true },
    });

    return { ok: true, staff: { ...staff, user } };
  }

  async update(
    businessId: string,
    staffId: string,
    args: {
      name?: string;
      title?: string;
      specialization?: string;
      consultationFeeCents?: number;
      consultationDurationMin?: number;
    },
  ) {
    const existing = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
      select: { id: true, businessId: true, userId: true },
    });
    if (!existing || existing.businessId !== businessId)
      throw new BadRequestException('Staff not found');

    if (args.name) {
      await this.prisma.user.update({
        where: { id: existing.userId },
        data: { name: args.name },
      });
    }

    return this.prisma.staffProfile.update({
      where: { id: staffId },
      data: {
        ...(args.title !== undefined && { title: args.title }),
        ...(args.specialization !== undefined && { specialization: args.specialization }),
        ...(args.consultationFeeCents !== undefined && { consultationFeeCents: args.consultationFeeCents }),
        ...(args.consultationDurationMin !== undefined && { consultationDurationMin: args.consultationDurationMin }),
      },
      select: {
        id: true,
        title: true,
        specialization: true,
        consultationFeeCents: true,
        consultationDurationMin: true,
        isAvailable: true,
        user: { select: { id: true, name: true } },
        hours: {
          orderBy: { weekday: 'asc' },
          select: { weekday: true, startMin: true, endMin: true, isOff: true },
        },
      },
    });
  }

  async setAvailability(businessId: string, staffId: string, isAvailable: boolean) {
    const existing = await this.prisma.staffProfile.findUnique({ where: { id: staffId } });
    if (!existing || existing.businessId !== businessId)
      throw new BadRequestException('Staff not found');

    return this.prisma.staffProfile.update({
      where: { id: staffId },
      data: { isAvailable },
      select: { id: true, isAvailable: true },
    });
  }

  async setHours(businessId: string, staffId: string, args: { weekday: number; startMin: number; endMin: number; isOff?: boolean }) {
    const existing = await this.prisma.staffProfile.findUnique({ where: { id: staffId } });
    if (!existing || existing.businessId !== businessId)
      throw new BadRequestException('Staff not found');

    return this.prisma.staffHours.upsert({
      where: { staffId_weekday: { staffId, weekday: args.weekday } },
      create: { staffId, weekday: args.weekday, startMin: args.startMin, endMin: args.endMin, isOff: args.isOff ?? false },
      update: { startMin: args.startMin, endMin: args.endMin, isOff: args.isOff ?? false },
      select: { staffId: true, weekday: true, startMin: true, endMin: true, isOff: true },
    });
  }
}
