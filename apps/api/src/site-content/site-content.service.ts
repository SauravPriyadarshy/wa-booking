import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type IORedis from 'ioredis';

const CACHE_TTL = 300; // 5 minutes

function cacheKey(group: string, locale: string) {
  return `site-content:${group}:${locale}`;
}

@Injectable()
export class SiteContentService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS') private redis: IORedis,
  ) {}

  /** Return all keys for a group as a flat { key: value } map. Cached in Redis. */
  async getGroup(group: string, locale = 'en'): Promise<Record<string, string>> {
    const key = cacheKey(group, locale);
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as Record<string, string>;
    } catch {
      // Redis unavailable — fall through to DB
    }

    const rows = await this.prisma.siteContent.findMany({
      where: { group, locale },
      select: { key: true, value: true },
    });
    const result = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    try {
      await this.redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
    } catch {
      // ignore cache write failures
    }

    return result;
  }

  /** Return a single key's value. */
  async getKey(key: string, locale = 'en'): Promise<string | null> {
    const row = await this.prisma.siteContent.findUnique({
      where: { key_locale: { key, locale } },
      select: { value: true },
    });
    return row?.value ?? null;
  }

  /** List all content rows for the super admin editor. */
  async listAll(group?: string, locale?: string) {
    return this.prisma.siteContent.findMany({
      where: {
        ...(group ? { group } : {}),
        ...(locale ? { locale } : {}),
      },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
      select: { id: true, key: true, locale: true, group: true, label: true, value: true, updatedBy: true, updatedAt: true },
    });
  }

  /** Upsert a single content key. Invalidates Redis cache for the group. */
  async upsert(key: string, locale: string, value: string, updatedBy: string) {
    const existing = await this.prisma.siteContent.findUnique({
      where: { key_locale: { key, locale } },
      select: { group: true, label: true },
    });
    if (!existing) {
      throw new Error(`Content key "${key}" locale "${locale}" does not exist. Keys must be seeded first.`);
    }

    const row = await this.prisma.siteContent.update({
      where: { key_locale: { key, locale } },
      data: { value, updatedBy },
      select: { key: true, group: true, locale: true, updatedAt: true },
    });

    await this.invalidateCache(row.group, row.locale);
    return { ok: true, key: row.key, updatedAt: row.updatedAt };
  }

  /** Bulk upsert — only updates existing keys, ignores unknown ones. */
  async bulkUpsert(items: Array<{ key: string; locale?: string; value: string }>, updatedBy: string) {
    const results: Array<{ key: string; ok: boolean; error?: string }> = [];
    for (const item of items) {
      const locale = item.locale ?? 'en';
      try {
        await this.upsert(item.key, locale, item.value, updatedBy);
        results.push({ key: item.key, ok: true });
      } catch (e) {
        results.push({ key: item.key, ok: false, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }
    return { results };
  }

  private async invalidateCache(group: string, locale: string) {
    try {
      await this.redis.del(cacheKey(group, locale));
    } catch {
      // ignore
    }
  }
}
