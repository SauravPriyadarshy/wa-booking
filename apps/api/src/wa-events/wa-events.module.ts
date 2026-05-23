import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaEventsController } from './wa-events.controller';
import { WaEventsService } from './wa-events.service';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [QueuesModule],
  controllers: [WaEventsController],
  providers: [PrismaService, WaEventsService],
})
export class WaEventsModule {}

