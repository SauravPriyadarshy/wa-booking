import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  list(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        priceCents: true,
        isActive: true,
      },
    });
  }

  create(businessId: string, data: any) {
    return this.prisma.service.create({
      data: { businessId, ...data },
      select: {
        id: true,
        name: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        priceCents: true,
        isActive: true,
      },
    });
  }

  async update(businessId: string, id: string, data: any) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing || existing.businessId !== businessId)
      throw new BadRequestException('Service not found');

    return this.prisma.service.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        priceCents: true,
        isActive: true,
      },
    });
  }
}

