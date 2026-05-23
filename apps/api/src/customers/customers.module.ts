import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController],
  providers: [PrismaService, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}

