import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Pings the wa-worker /health endpoint every 10 minutes so that Render's free
 * tier never sleeps the service.  No-op when WA_WORKER_URL is not set.
 */
@Injectable()
export class WhatsAppKeepAlive {
  private readonly logger = new Logger(WhatsAppKeepAlive.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async ping() {
    const url = process.env.WA_WORKER_URL;
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return;
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(8_000) });
      if (res.ok) {
        this.logger.verbose(`wa-worker keep-alive OK`);
      } else {
        this.logger.warn(`wa-worker keep-alive returned ${res.status}`);
      }
    } catch (e) {
      this.logger.warn(`wa-worker keep-alive failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}
