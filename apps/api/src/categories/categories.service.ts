import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { SUBCATEGORY_SEEDS } from '../common/subcategory-seeds';

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

  private fetchActive() {
    return this.prisma.businessCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        templateJson: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            key: true,
            name: true,
            nameHi: true,
            isOther: true,
          },
        },
      },
    });
  }

  async listActive() {
    let rows = await this.fetchActive();
    if (rows.some((r) => !r.subcategories?.length)) {
      await this.seedSubcategories();
      rows = await this.fetchActive();
    }
    return rows;
  }

  async syncAndList() {
    await this.seedSubcategories();
    return this.fetchActive();
  }

  async seedSubcategories() {
    let count = 0;
    for (const [categoryKey, items] of Object.entries(SUBCATEGORY_SEEDS)) {
      const category = await this.prisma.businessCategory.findUnique({
        where: { key: categoryKey },
      });
      if (!category) continue;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await this.prisma.businessSubcategory.upsert({
          where: {
            categoryId_key: { categoryId: category.id, key: item.key },
          },
          create: {
            categoryId: category.id,
            key: item.key,
            name: item.name,
            nameHi: item.nameHi ?? item.name,
            sortOrder: i,
            isOther: item.isOther ?? false,
            isActive: true,
          },
          update: {
            name: item.name,
            nameHi: item.nameHi ?? item.name,
            sortOrder: i,
            isOther: item.isOther ?? false,
            isActive: true,
          },
        });
        count++;
      }
    }
    return { ok: true, count };
  }

  listActiveLegacy() {
    return this.listActive();
  }

  /** @deprecated use listActive */
  _legacyList() {
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
    await this.seedSubcategories();
    return { ok: true, count: DEFAULT_TEMPLATES.length };
  }
}

