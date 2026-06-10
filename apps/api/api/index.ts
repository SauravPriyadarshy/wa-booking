import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { AppModule } from '../src/app.module';
import { applySecurityMiddleware, corsOriginChecker } from '../src/common/security-config';

let cachedExpressHandler: ((req: any, res: any) => any) | null = null;

async function getExpressHandler(): Promise<(req: any, res: any) => any> {
  if (cachedExpressHandler) return cachedExpressHandler;

  const app = await NestFactory.create(AppModule);
  applySecurityMiddleware(app);
  app.use(cookieParser());
  app.use(
    pinoHttp({
      autoLogging: true,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    }),
  );

  app.enableCors({
    origin: corsOriginChecker(),
    credentials: true,
  });

  await app.init();
  cachedExpressHandler = app.getHttpAdapter().getInstance();
  return cachedExpressHandler;
}

export default async function handler(req: any, res: any) {
  const h = await getExpressHandler();
  return h(req, res);
}
