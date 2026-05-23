import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesModule } from '../queues/queues.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [QueuesModule],
  controllers: [AppointmentsController],
  providers: [PrismaService, AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
