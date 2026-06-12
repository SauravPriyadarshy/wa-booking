import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [StaffController],
  providers: [PrismaService, StaffService],
})
export class StaffModule {}

