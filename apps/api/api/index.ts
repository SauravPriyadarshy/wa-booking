import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { AppModule } from '../src/app.module';

let cachedExpressHandler: ((req: any, res: any) => any) | null = null;

async function getExpressHandler(): Promise<(req: any, res: any) => any> {
  if (cachedExpressHandler) return cachedExpressHandler;

  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  app.use(
    pinoHttp({
      autoLogging: true,
    }),
  );

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);
      if (origins.length === 0) return cb(null, true);
      return cb(null, origins.includes(origin));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  // `expressApp` is a request handler function (req, res).
  cachedExpressHandler = expressApp;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  const h = await getExpressHandler();
  return h(req, res);
}

