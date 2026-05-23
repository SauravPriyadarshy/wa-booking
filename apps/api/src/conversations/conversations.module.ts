import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  controllers: [ConversationsController],
  providers: [PrismaService, ConversationsService],
})
export class ConversationsModule {}

