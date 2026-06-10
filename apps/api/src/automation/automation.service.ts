import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const CLINIC_FOLLOWUP_DAYS = [7, 15, 30, 90] as const;
export const INACTIVE_RECOVERY_DAYS = 45;

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('QUEUE_REMINDERS') private remindersQueue: any,
  ) {}

  async isClinicFollowupEnabled(businessId: string, days: number): Promise<boolean> {
    const key = `followup_${days}`;
    const feature = await this.prisma.businessFeature.findUnique({
      where: { businessId_key: { businessId, key } },
    });
    if (feature) return feature.enabled;

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { category: { select: { key: true } } },
    });
    return business?.category?.key === 'clinic';
  }

  async getFollowupSettings(businessId: string) {
    const features = await this.prisma.businessFeature.findMany({
      where: { businessId, key: { startsWith: 'followup_' } },
      select: { key: true, enabled: true },
    });
    const map = new Map(features.map((f) => [f.key.replace('followup_', ''), f.enabled]));
    const intervals: Record<string, boolean> = {};
    for (const days of CLINIC_FOLLOWUP_DAYS) {
      intervals[String(days)] = map.has(String(days))
        ? (map.get(String(days)) ?? false)
        : await this.isClinicFollowupEnabled(businessId, days);
    }
    return { intervals };
  }

  async setFollowupSettings(businessId: string, intervals: Record<string, boolean>) {
    for (const [days, enabled] of Object.entries(intervals)) {
      if (!CLINIC_FOLLOWUP_DAYS.includes(Number(days) as (typeof CLINIC_FOLLOWUP_DAYS)[number])) continue;
      await this.prisma.businessFeature.upsert({
        where: { businessId_key: { businessId, key: `followup_${days}` } },
        create: { businessId, key: `followup_${days}`, enabled },
        update: { enabled },
      });
    }
    return this.getFollowupSettings(businessId);
  }

  async scheduleClinicFollowups(args: {
    businessId: string;
    appointmentId: string;
    customerId: string;
    customerName: string | null;
    customerPhone: string | null;
    serviceName: string;
    businessName: string;
    bookingSlug: string | null;
    doctorName?: string | null;
  }) {
    for (const days of CLINIC_FOLLOWUP_DAYS) {
      if (!(await this.isClinicFollowupEnabled(args.businessId, days))) continue;
      try {
        await this.remindersQueue.add(
          'clinic_followup',
          {
            ...args,
            intervalDays: days,
          },
          {
            delay: days * 24 * 60 * 60 * 1000,
            jobId: `clinic_followup:${args.appointmentId}:${days}`,
            removeOnComplete: true,
          },
        );
      } catch (e) {
        this.logger.warn(`Failed to enqueue clinic_followup ${days}d: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  /** Daily 9:00 AM IST (~3:30 UTC) — recover inactive customers (45+ days). */
  @Cron('30 3 * * *')
  async runInactiveRecovery() {
    if (!process.env.DATABASE_URL) return;
    const cutoff = new Date(Date.now() - INACTIVE_RECOVERY_DAYS * 24 * 60 * 60 * 1000);

    const businesses = await this.prisma.business.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      take: 200,
    });

    for (const biz of businesses) {
      const wa = await this.prisma.whatsAppSession.findUnique({
        where: { businessId: biz.id },
        select: { status: true },
      });
      if (wa?.status !== 'CONNECTED') continue;

      const customers = await this.prisma.customer.findMany({
        where: {
          businessId: biz.id,
          phone: { not: null },
          appointments: {
            some: { status: AppointmentStatus.COMPLETED },
          },
          NOT: {
            appointments: {
              some: {
                startAt: { gte: cutoff },
                status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.CONFIRMED] },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          appointments: {
            where: { status: AppointmentStatus.COMPLETED },
            orderBy: { startAt: 'desc' },
            take: 1,
            select: { service: { select: { name: true } } },
          },
        },
        take: 30,
      });

      for (const customer of customers) {
        const already = await this.prisma.followUpLog.findFirst({
          where: {
            businessId: biz.id,
            customerId: customer.id,
            kind: 'inactive_recovery',
            sentAt: { gte: cutoff },
          },
        });
        if (already || !customer.phone) continue;

        try {
          await this.remindersQueue.add(
            'inactive_recovery',
            {
              businessId: biz.id,
              customerId: customer.id,
              customerName: customer.name,
              phone: customer.phone,
              businessName: biz.name,
              bookingSlug: biz.slug,
              serviceName: customer.appointments[0]?.service?.name ?? 'visit',
              intervalDays: INACTIVE_RECOVERY_DAYS,
            },
            { jobId: `inactive_recovery:${customer.id}:${cutoff.toISOString().slice(0, 10)}`, removeOnComplete: true },
          );
        } catch (e) {
          this.logger.warn(`inactive_recovery enqueue failed: ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    this.logger.log(`Inactive recovery scan complete (${businesses.length} businesses)`);
  }
}
