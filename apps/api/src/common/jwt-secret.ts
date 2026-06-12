import { ConfigService } from '@nestjs/config';

/** Empty JWT_SECRET in .env breaks passport-jwt — treat blank as unset. */
export function resolveJwtSecret(config: ConfigService): string {
  const raw = config.get<string>('JWT_SECRET')?.trim();
  return raw || 'dev';
}
