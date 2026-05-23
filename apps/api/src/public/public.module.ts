import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [AppointmentsModule, BusinessesModule, CustomersModule],
  controllers: [PublicController],
})
export class PublicModule {}
