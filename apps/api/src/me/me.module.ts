import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [MeController],
  providers: [PrismaService, MeService],
})
export class MeModule {}

