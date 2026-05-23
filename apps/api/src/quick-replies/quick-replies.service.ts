import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuickRepliesService {
  constructor(private prisma: PrismaService) {}

  list(businessId: string) {
    return this.prisma.quickReply.findMany({
      where: { businessId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, body: true, tags: true, isActive: true },
      take: 50,
    });
  }

  create(businessId: string, dto: any) {
    return this.prisma.quickReply.create({
      data: {
        businessId,
        title: dto.title,
        body: dto.body,
        tags: dto.tags ?? [],
        isActive: dto.isActive ?? true,
      },
      select: { id: true, title: true, body: true, tags: true, isActive: true },
    });
  }
}

