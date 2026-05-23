import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TEMPLATES = [
  {
    key: 'clinic',
    name: 'Clinic',
    templateJson: {
      services: [
        { name: 'Consultation', durationMin: 15 },
        { name: 'Follow-up', durationMin: 10 },
        { name: 'Vaccination', durationMin: 20, bufferAfterMin: 5 },
      ],
    },
  },
  {
    key: 'salon',
    name: 'Salon',
    templateJson: {
      services: [
        { name: 'Haircut', durationMin: 20 },
        { name: 'Beard', durationMin: 15 },
        { name: 'Facial', durationMin: 45, bufferAfterMin: 10 },
      ],
    },
  },
  {
    key: 'spa',
    name: 'Spa',
    templateJson: {
      services: [
        { name: 'Massage', durationMin: 60, bufferAfterMin: 10 },
        { name: 'Therapy', durationMin: 45, bufferAfterMin: 10 },
      ],
    },
  },
  {
    key: 'home_service',
    name: 'Home Service',
    templateJson: {
      services: [
        { name: 'AC Repair', durationMin: 60, bufferAfterMin: 10 },
        { name: 'Plumbing', durationMin: 45, bufferAfterMin: 10 },
        { name: 'Electrician', durationMin: 45, bufferAfterMin: 10 },
      ],
    },
  },
];

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  listActive() {
    return this.prisma.businessCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, key: true, name: true, description: true, templateJson: true },
    });
  }

  async seedDefaults() {
    for (const item of DEFAULT_TEMPLATES) {
      await this.prisma.businessCategory.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          name: item.name,
          templateJson: item.templateJson as any,
          isActive: true,
        },
        update: {
          name: item.name,
          templateJson: item.templateJson as any,
          isActive: true,
        },
      });
    }
    return { ok: true, count: DEFAULT_TEMPLATES.length };
  }
}

