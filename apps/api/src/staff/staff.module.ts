import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  controllers: [StaffController],
  providers: [PrismaService, StaffService],
})
export class StaffModule {}

