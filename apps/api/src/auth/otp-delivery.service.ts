import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type IORedis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export type OtpChannel = 'whatsapp' | 'email';

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);
  private resolvedBusinessId: string | null | undefined;

  constructor(
    @Inject('REDIS') private readonly redis: IORedis,
    private readonly whatsapp: WhatsAppService,
    private readonly prisma: PrismaService,
  ) {}

  private otpKey(phone: string) {
    return `otp:${phone}`;
  }

  private devBypassEnabled() {
    return process.env.OTP_ALLOW_DEV_BYPASS !== 'false';
  }

  private generateCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  /** WhatsApp-web.js expects digits only, with country code (91XXXXXXXXXX). */
  private normalizeWaRecipient(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    if (digits.startsWith('91') && digits.length >= 12) return digits.slice(0, 12);
    return digits;
  }

  private async resolveOtpBusinessId(): Promise<string | null> {
    if (this.resolvedBusinessId !== undefined) return this.resolvedBusinessId;

    const fromEnv = process.env.OTP_WA_BUSINESS_ID?.trim();
    if (fromEnv) {
      this.resolvedBusinessId = fromEnv;
      return fromEnv;
    }

    const connected = await this.prisma.whatsAppSession.findFirst({
      where: { status: 'CONNECTED' },
      orderBy: { lastConnectedAt: 'desc' },
      select: { businessId: true },
    });

    if (connected) {
      this.logger.log(`OTP sender auto-resolved to business ${connected.businessId}`);
      this.resolvedBusinessId = connected.businessId;
      return connected.businessId;
    }

    this.resolvedBusinessId = null;
    return null;
  }

  async storeAndSend(args: {
    phone: string;
    channel: OtpChannel;
    email?: string;
  }): Promise<{ ok: true; channel: OtpChannel; devCode?: string; delivered?: boolean }> {
    const code = this.generateCode();
    const ttlSec = 600;
    let stored = false;

    try {
      await this.redis.set(this.otpKey(args.phone), code, 'EX', ttlSec);
      stored = true;
    } catch (e) {
      this.logger.warn(`Redis OTP store failed: ${e instanceof Error ? e.message : e}`);
    }

    const message = `Your BookNow verification code is ${code}. Valid for 10 minutes. Do not share this code.`;
    let delivered = false;

    if (args.channel === 'whatsapp') {
      delivered = await this.sendViaWhatsApp(args.phone, message);
    } else {
      if (!args.email?.trim()) {
        throw new BadRequestException('Email is required for email OTP');
      }
      delivered = await this.sendViaEmail(args.email.trim(), message);
    }

    if (!delivered) {
      const hint =
        args.channel === 'whatsapp'
          ? 'WhatsApp OTP not sent — connect WA worker session or set OTP_WA_BUSINESS_ID'
          : 'Email OTP not sent — set RESEND_API_KEY';
      this.logger.warn(`${hint}. Phone ${args.phone.slice(-4).padStart(args.phone.length, '*')}`);

      if (!stored && !this.devBypassEnabled()) {
        throw new BadRequestException(
          args.channel === 'whatsapp'
            ? 'Could not send OTP on WhatsApp. Try email instead.'
            : 'Could not send OTP email. Try WhatsApp instead.',
        );
      }
    }

    const showDevCode = process.env.NODE_ENV !== 'production' && (!delivered || this.devBypassEnabled());

    return {
      ok: true,
      channel: args.channel,
      delivered,
      ...(showDevCode ? { devCode: code } : {}),
    };
  }

  async verifyStoredCode(phone: string, code: string): Promise<boolean> {
    const trimmed = code.trim();

    if (this.devBypassEnabled() && trimmed === '1234') {
      return true;
    }

    try {
      const stored = await this.redis.get(this.otpKey(phone));
      if (stored && stored === trimmed) {
        await this.redis.del(this.otpKey(phone));
        return true;
      }
    } catch {
      /* fall through */
    }

    return false;
  }

  private async sendViaWhatsApp(phone: string, message: string): Promise<boolean> {
    const businessId = await this.resolveOtpBusinessId();
    if (!businessId) {
      this.logger.warn('No OTP WhatsApp sender — set OTP_WA_BUSINESS_ID or connect a business session');
      return false;
    }

    const live = await this.whatsapp.workerStatus(businessId);
    if (live.status !== 'CONNECTED') {
      this.logger.warn(
        `OTP WhatsApp session ${businessId} is ${live.status ?? 'DISCONNECTED'} — scan QR at /app/whatsapp`,
      );
      return false;
    }

    const to = this.normalizeWaRecipient(phone);
    const result = await this.whatsapp.sendMessage(businessId, to, message);
    if (!result.ok) {
      this.logger.warn(`WhatsApp OTP send failed: ${result.error}`);
    }
    return result.ok;
  }

  private async sendViaEmail(email: string, message: string): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.OTP_EMAIL_FROM ?? 'BookNow <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.warn(`RESEND_API_KEY not set — email OTP to ${email} skipped`);
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Your BookNow verification code',
          text: message,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`Resend email failed (${res.status}): ${body}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.warn(`Email OTP send error: ${e instanceof Error ? e.message : e}`);
      return false;
    }
  }
}
