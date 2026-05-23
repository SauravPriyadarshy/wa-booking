import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';

@Module({
  controllers: [HubController],
  providers: [PrismaService, HubService],
})
export class HubModule {}

