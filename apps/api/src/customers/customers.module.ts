import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [CustomersController],
  providers: [PrismaService, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}

