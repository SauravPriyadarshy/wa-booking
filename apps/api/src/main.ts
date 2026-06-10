import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { applySecurityMiddleware, corsOriginChecker } from './common/security-config';

async function bootstrap() {
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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
