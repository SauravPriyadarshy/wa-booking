import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const QUEUE_WHATSAPP = 'whatsapp';
export const QUEUE_REMINDERS = 'reminders';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
        return new IORedis(url, { maxRetriesPerRequest: null, lazyConnect: true });
      },
    },
    {
      provide: 'QUEUE_WHATSAPP',
      inject: ['REDIS'],
      useFactory: (redis: IORedis) =>
        new Queue(QUEUE_WHATSAPP, { connection: redis }),
    },
    {
      provide: 'QUEUE_REMINDERS',
      inject: ['REDIS'],
      useFactory: (redis: IORedis) =>
        new Queue(QUEUE_REMINDERS, { connection: redis }),
    },
  ],
  exports: ['REDIS', 'QUEUE_WHATSAPP', 'QUEUE_REMINDERS'],
})
export class QueuesModule {}

