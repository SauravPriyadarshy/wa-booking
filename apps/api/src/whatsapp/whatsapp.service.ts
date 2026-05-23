import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Render free tier sleeps after 15 min inactivity; wake-up takes ~30-60s.
// We ping /health first so by the time connect() fires, the instance is ready.
const WAKE_TIMEOUT_MS = 8_000;  // quick health ping (fire-and-forget wakeup)
const CONNECT_TIMEOUT_MS = 90_000; // allow up to 90s for Chromium to init + QR
const STATUS_TIMEOUT_MS = 10_000;

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

  /** Fire-and-forget ping to wake Render free-tier instance before a long call. */
  private async pingWorker() {
    try {
      await fetch(`${this.workerBase()}/health`, { signal: AbortSignal.timeout(WAKE_TIMEOUT_MS) });
    } catch { /* ignore — just warming up */ }
  }

  async connect(businessId: string) {
    // Warm up sleeping Render instance before the slow Chromium init
    await this.pingWorker();
    try {
      const res = await fetch(`${this.workerBase()}/sessions/${businessId}/connect`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
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
      // Surface timeout distinctly so the frontend can show "waking up" instead of setup guide
      const msg = e instanceof Error && e.name === 'TimeoutError'
        ? 'WhatsApp worker is waking up. Please try again in 30 seconds.'
        : 'WhatsApp worker unreachable. Please try again.';
      throw new BadRequestException(msg);
    }
  }

  async workerStatus(businessId: string) {
    try {
      const res = await fetch(`${this.workerBase()}/sessions/${businessId}/status`, {
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
      });
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

