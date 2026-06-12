import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [HubController],
  providers: [PrismaService, HubService],
})
export class HubModule {}

