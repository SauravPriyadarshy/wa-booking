import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaEventsController } from './wa-events.controller';
import { WaEventsService } from './wa-events.service';

@Module({
  controllers: [WaEventsController],
  providers: [PrismaService, WaEventsService],
})
export class WaEventsModule {}

