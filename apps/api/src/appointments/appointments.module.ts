import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesModule } from '../queues/queues.module';
import { AutomationModule } from '../automation/automation.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [QueuesModule, AutomationModule],
  controllers: [AppointmentsController],
  providers: [PrismaService, AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
