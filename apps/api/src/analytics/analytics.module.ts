import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [AnalyticsController],
  providers: [PrismaService, AnalyticsService],
})
export class AnalyticsModule {}
