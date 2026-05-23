import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  list(businessId: string) {
    return this.prisma.staffProfile.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        isAvailable: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async create(businessId: string, args: { name: string; title?: string }) {
    // Create a STAFF user with no login creds yet (can be extended later)
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
        isAvailable: true,
      },
      select: { id: true, isAvailable: true, title: true },
    });

    return { ok: true, staff: { ...staff, user } };
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

