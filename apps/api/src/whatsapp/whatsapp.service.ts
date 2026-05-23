import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsAppService {
  constructor(private prisma: PrismaService) {}

  async getStatus(businessId: string) {
    const session = await this.prisma.whatsAppSession.findUnique({
      where: { businessId },
      select: { status: true, lastConnectedAt: true, updatedAt: true },
    });
    const workerUrl = process.env.WA_WORKER_URL ?? '';
    const workerConfigured = Boolean(
      workerUrl && !workerUrl.includes('localhost') && !workerUrl.includes('127.0.0.1'),
    );
    return {
      ...(session ?? { status: 'DISCONNECTED', lastConnectedAt: null, updatedAt: null }),
      workerConfigured,
    };
  }

  private workerBase() {
    return process.env.WA_WORKER_URL ?? 'http://localhost:3100';
  }

  async connect(businessId: string) {
    try {
      const res = await fetch(`${this.workerBase()}/sessions/${businessId}/connect`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new BadRequestException(data?.message ?? 'WhatsApp connect failed');

      const status = data?.status ?? 'QR_REQUIRED';
      await this.prisma.whatsAppSession.upsert({
        where: { businessId },
        create: { businessId, status },
        update: {
          status,
          lastConnectedAt: status === 'CONNECTED' ? new Date() : undefined,
        },
      });

      return data;
    } catch (e) {
      console.error('WhatsApp worker connect failed:', e);
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('WhatsApp worker unreachable');
    }
  }

  async workerStatus(businessId: string) {
    try {
      const res = await fetch(`${this.workerBase()}/sessions/${businessId}/status`);
      if (!res.ok) return { status: 'DISCONNECTED', message: 'Worker returned error' };
      const data: any = await res.json().catch(() => ({}));
      const status = data?.status ?? 'DISCONNECTED';
      await this.prisma.whatsAppSession.upsert({
        where: { businessId },
        create: { businessId, status },
        update: { status, lastConnectedAt: status === 'CONNECTED' ? new Date() : undefined },
      });
      return data;
    } catch (e) {
      console.error('WhatsApp worker status check failed:', e);
      return { status: 'DISCONNECTED', error: 'Worker unreachable' };
    }
  }

  /**
   * Send a WhatsApp message via the worker.
   * Returns { ok: true, waMessageId } on success, { ok: false, error } on failure.
   * Non-throwing — callers should handle the error field.
   */
  async sendMessage(businessId: string, to: string, message: string): Promise<{ ok: boolean; waMessageId?: string; error?: string }> {
    try {
      const res = await fetch(`${this.workerBase()}/sessions/${businessId}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to, message }),
        signal: AbortSignal.timeout(15_000),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data?.error ?? 'Send failed' };
      return { ok: true, waMessageId: data?.waMessageId };
    } catch (e) {
      console.error(`WhatsApp sendMessage failed (${businessId} → ${to}):`, e);
      return { ok: false, error: e instanceof Error ? e.message : 'Worker unreachable' };
    }
  }
}

