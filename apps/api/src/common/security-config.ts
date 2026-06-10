import type { INestApplication, ValidationPipeOptions } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

/** Shared Helmet + validation config for main.ts and Vercel serverless entry. */
export function applySecurityMiddleware(app: INestApplication) {
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    }),
  );

  app.useGlobalPipes(new ValidationPipe(validationPipeOptions()));
}

export function validationPipeOptions(): ValidationPipeOptions {
  return {
    whitelist: true,
    transform: true,
    forbidUnknownValues: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  };
}

export function corsOriginChecker() {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isProd = process.env.NODE_ENV === 'production';

  return (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return cb(null, true);
    if (origins.length === 0) return cb(null, isProd ? false : true);
    return cb(null, origins.includes(origin));
  };
}

export function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

/** Block dangerous bootstrap endpoints in production. */
export function assertNotProductionEndpoint(endpoint: string) {
  if (isProduction()) {
    return { ok: false, message: `${endpoint} is disabled in production` };
  }
  return null;
}
