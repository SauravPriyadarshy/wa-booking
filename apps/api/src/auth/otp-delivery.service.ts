import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type IORedis from 'ioredis';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export type OtpChannel = 'whatsapp' | 'email';

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);

  constructor(
    @Inject('REDIS') private readonly redis: IORedis,
    private readonly whatsapp: WhatsAppService,
  ) {}

  private otpKey(phone: string) {
    return `otp:${phone}`;
  }

  private generateCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async storeAndSend(args: {
    phone: string;
    channel: OtpChannel;
    email?: string;
  }): Promise<{ ok: true; channel: OtpChannel; devCode?: string }> {
    const code = this.generateCode();
    const ttlSec = 600;

    try {
      await this.redis.set(this.otpKey(args.phone), code, 'EX', ttlSec);
    } catch (e) {
      this.logger.warn(`Redis OTP store failed: ${e instanceof Error ? e.message : e}`);
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException('OTP service temporarily unavailable');
      }
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

    const isProd = process.env.NODE_ENV === 'production';
    if (!delivered && isProd) {
      throw new BadRequestException(
        args.channel === 'whatsapp'
          ? 'Could not send OTP on WhatsApp. Try email instead.'
          : 'Could not send OTP email. Try WhatsApp instead.',
      );
    }

    return {
      ok: true,
      channel: args.channel,
      ...(!delivered || !isProd ? { devCode: code } : {}),
    };
  }

  async verifyStoredCode(phone: string, code: string): Promise<boolean> {
    try {
      const stored = await this.redis.get(this.otpKey(phone));
      if (stored && stored === code.trim()) {
        await this.redis.del(this.otpKey(phone));
        return true;
      }
    } catch {
      /* fall through to dev stub */
    }

    if (process.env.NODE_ENV !== 'production' && code.trim() === '1234') {
      return true;
    }
    return false;
  }

  private async sendViaWhatsApp(phone: string, message: string): Promise<boolean> {
    const businessId = process.env.OTP_WA_BUSINESS_ID;
    if (!businessId) {
      this.logger.warn('OTP_WA_BUSINESS_ID not set — WhatsApp OTP skipped');
      return false;
    }

    const to = phone.replace(/\D/g, '');
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
