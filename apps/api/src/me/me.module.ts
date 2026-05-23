import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  controllers: [MeController],
  providers: [PrismaService, MeService],
})
export class MeModule {}

