import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UiModuleKey =
  | 'hub'
  | 'bookings'
  | 'customers'
  | 'leads'
  | 'support'
  | 'payments'
  | 'staff'
  | 'analytics'
  | 'whatsapp-connect'
  | 'more';

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        businessId: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
            isActive: true,
            category: { select: { key: true, name: true } },
            features: { select: { key: true, enabled: true } },
          },
        },
      },
    });

    if (!user) return { ok: false };

    const enabledFeatures =
      user.business?.features?.filter((f) => f.enabled).map((f) => f.key) ?? [];

    return {
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        businessId: user.businessId,
      },
      business: user.business
        ? {
            id: user.business.id,
            name: user.business.name,
            slug: user.business.slug,
            timezone: user.business.timezone,
            isActive: user.business.isActive,
            categoryKey: user.business.category?.key ?? null,
            categoryName: user.business.category?.name ?? null,
            enabledFeatures,
          }
        : null,
    };
  }

  async getUiConfig(userId: string) {
    const me = await this.getMe(userId);
    if (!me.ok) return { ok: false as const };

    const role = me.user?.role;
    if (!role) return { ok: false as const };
    const categoryKey = me.business?.categoryKey ?? null;
    const enabled = new Set(me.business?.enabledFeatures ?? []);
    const noFlagsYet = enabled.size === 0;

    const has = (k: string) => enabled.has(k) || noFlagsYet;

    const isStaff = role === 'STAFF';
    const isOwnerLike = role === 'SUPER_ADMIN' || role === 'BUSINESS_ADMIN';

    const modules: UiModuleKey[] = [];

    // Always: Hub + Bookings. This is the "simple like WhatsApp" core.
    modules.push('hub');
    modules.push('bookings');

    if (has('crm')) modules.push('customers');
    if (has('support')) modules.push('support');
    if (has('payments')) modules.push('payments');
    if (has('analytics') && !isStaff) modules.push('analytics');

    // Leads are useful for most businesses, but keep staff UI minimal.
    if (has('support') || has('crm')) {
      if (has('whatsapp')) modules.push('leads');
      else if (isOwnerLike) modules.push('leads');
    }

    // Queue is category-specific; we keep it under "More" until implemented.
    // (categoryKey can be used later to promote Queue into the main nav.)
    void categoryKey;

    // WhatsApp connect is a setup screen, not a primary module.
    if (has('whatsapp') && isOwnerLike) modules.push('whatsapp-connect');

    modules.push('more');

    // Hard cap for bottom-nav: we only expose a subset on the client.
    return {
      ok: true as const,
      role,
      categoryKey,
      slug: me.business?.slug ?? null,
      modules: Array.from(new Set(modules)),
      quickActions: [
        { key: 'new-booking', label: 'New booking' },
        { key: 'reply', label: 'Reply on WhatsApp' },
        ...(has('support') ? [{ key: 'new-ticket', label: 'Create ticket' }] : []),
        ...(has('crm') ? [{ key: 'new-customer', label: 'Add customer' }] : []),
        ...(has('payments') ? [{ key: 'payment-reminder', label: 'Payment reminder' }] : []),
      ],
    };
  }
}

