import { Module } from '@nestjs/common';
import { QueuesModule } from '../queues/queues.module';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from './automation.service';

@Module({
  imports: [QueuesModule],
  providers: [PrismaService, AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
