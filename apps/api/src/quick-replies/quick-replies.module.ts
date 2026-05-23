import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuickRepliesController } from './quick-replies.controller';
import { QuickRepliesService } from './quick-replies.service';

@Module({
  controllers: [QuickRepliesController],
  providers: [PrismaService, QuickRepliesService],
})
export class QuickRepliesModule {}

