import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/auth/user-role.enum';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async listBusinesses() {
    return this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, slug: true, isActive: true, createdAt: true, categoryId: true },
    });
  }

  async createBusinessWithAdmin(args: {
    name: string;
    categoryId?: string;
    phone?: string;
    adminUsername: string;
    adminPassword: string;
  }) {
    const base = slugify(args.name);
    if (!base) throw new BadRequestException('Invalid business name');

    const existingUser = await this.prisma.user.findUnique({
      where: { username: args.adminUsername },
      select: { id: true },
    });
    if (existingUser) throw new BadRequestException('Admin username already exists');

    const existingCount = await this.prisma.business.count({
      where: { slug: { startsWith: base } },
    });
    const slug = existingCount === 0 ? base : `${base}-${existingCount + 1}`;

    const category = args.categoryId
      ? await this.prisma.businessCategory.findUnique({ where: { id: args.categoryId } })
      : null;

    const business = await this.prisma.business.create({
      data: {
        name: args.name,
        slug,
        phone: args.phone,
        categoryId: args.categoryId,
      },
      select: { id: true, name: true, slug: true, categoryId: true },
    });

    const passwordHash = await bcrypt.hash(args.adminPassword, 10);
    const adminUser = await this.prisma.user.create({
      data: {
        username: args.adminUsername,
        passwordHash,
        passwordUpdatedAt: new Date(),
        role: UserRole.BUSINESS_ADMIN,
        businessId: business.id,
      },
      select: { id: true, username: true, role: true, businessId: true },
    });

    // apply template services
    const tpl = (category?.templateJson as any) ?? null;
    const services: any[] = Array.isArray(tpl?.services) ? tpl.services : [];
    if (services.length > 0) {
      await this.prisma.service.createMany({
        data: services.map((s) => ({
          businessId: business.id,
          name: String(s.name),
          durationMin: Number(s.durationMin ?? 15),
          bufferBeforeMin: Number(s.bufferBeforeMin ?? 0),
          bufferAfterMin: Number(s.bufferAfterMin ?? 0),
          isActive: true,
        })),
      });
    }

    return {
      ok: true,
      business,
      adminUser,
      templateServicesCreated: services.length,
    };
  }

  async listBusinessFeatures(businessId: string) {
    const existing = await this.prisma.businessFeature.findMany({
      where: { businessId },
      select: { key: true, enabled: true, updatedAt: true },
      orderBy: { key: 'asc' },
    });
    return existing;
  }

  async setBusinessFeature(args: { businessId: string; key: string; enabled: boolean }) {
    return this.prisma.businessFeature.upsert({
      where: { businessId_key: { businessId: args.businessId, key: args.key } },
      create: { businessId: args.businessId, key: args.key, enabled: args.enabled },
      update: { enabled: args.enabled },
      select: { key: true, enabled: true },
    });
  }
}

