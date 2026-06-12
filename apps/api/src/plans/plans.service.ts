import { ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  effectivePlan,
  featuresForPlan,
  hasFeature,
  limitsForPlan,
  PlanFeature,
  PlanSnapshot,
  UPGRADE_MESSAGES,
} from './plan-limits';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getSnapshot(businessId: string): Promise<PlanSnapshot> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { plan: true, planExpiresAt: true },
    });
    if (!business) {
      return {
        plan: SubscriptionPlan.FREE,
        effectivePlan: SubscriptionPlan.FREE,
        planExpiresAt: null,
        expired: false,
        limits: limitsForPlan(SubscriptionPlan.FREE),
        features: featuresForPlan(SubscriptionPlan.FREE),
      };
    }

    const { effective, expired } = effectivePlan(business.plan, business.planExpiresAt);
    return {
      plan: business.plan,
      effectivePlan: effective,
      planExpiresAt: business.planExpiresAt,
      expired,
      limits: limitsForPlan(effective),
      features: featuresForPlan(effective),
    };
  }

  async assertFeature(businessId: string, feature: PlanFeature) {
    const snap = await this.getSnapshot(businessId);
    if (hasFeature(snap, feature)) return snap;
    const msg = UPGRADE_MESSAGES[feature]?.en ?? 'Upgrade required for this feature.';
    throw new ForbiddenException(msg);
  }

  async assertCanAddStaff(businessId: string) {
    const snap = await this.getSnapshot(businessId);
    const max = snap.limits.maxStaff;
    if (max == null) return snap;
    const count = await this.prisma.staffProfile.count({ where: { businessId } });
    if (count >= max) {
      throw new ForbiddenException(UPGRADE_MESSAGES.staff_management.en);
    }
    return snap;
  }

  async assertCanAddCustomer(businessId: string) {
    const snap = await this.getSnapshot(businessId);
    const max = snap.limits.maxCustomers;
    if (max == null) return snap;
    const count = await this.prisma.customer.count({ where: { businessId } });
    if (count >= max) {
      throw new ForbiddenException(
        `Free plan allows up to ${max} customers. Upgrade to Plus for unlimited customers.`,
      );
    }
    return snap;
  }

  async assertCanAddBooking(businessId: string) {
    const snap = await this.getSnapshot(businessId);
    const max = snap.limits.maxBookingsPerMonth;
    if (max == null) return snap;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const count = await this.prisma.appointment.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth },
        status: { not: 'CANCELLED' },
      },
    });
    if (count >= max) {
      throw new ForbiddenException(
        `Free plan allows ${max} bookings per month. Upgrade to Plus for unlimited bookings.`,
      );
    }
    return snap;
  }

  async usage(businessId: string) {
    const snap = await this.getSnapshot(businessId);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [customers, staff, bookingsThisMonth] = await Promise.all([
      this.prisma.customer.count({ where: { businessId } }),
      this.prisma.staffProfile.count({ where: { businessId } }),
      this.prisma.appointment.count({
        where: { businessId, createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
      }),
    ]);
    return {
      ...snap,
      usage: { customers, staff, bookingsThisMonth },
    };
  }
}
