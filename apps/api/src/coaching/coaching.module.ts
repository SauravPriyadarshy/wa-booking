import { Module } from '@nestjs/common';
import { CoachingController } from './coaching.controller';
import { CoachingService } from './coaching.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [CoachingController],
  providers: [PrismaService, CoachingService],
})
export class CoachingModule {}
