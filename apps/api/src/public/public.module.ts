import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { BusinessSuccessService } from './business-success.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { CustomersModule } from '../customers/customers.module';
import { PlansModule } from '../plans/plans.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [AppointmentsModule, BusinessesModule, CustomersModule, PlansModule],
  controllers: [PublicController],
  providers: [BusinessSuccessService, PrismaService],
})
export class PublicModule {}
