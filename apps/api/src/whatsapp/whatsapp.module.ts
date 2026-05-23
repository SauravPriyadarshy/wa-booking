import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppKeepAlive } from './whatsapp-keepalive.service';

@Module({
  controllers: [WhatsAppController],
  providers: [PrismaService, WhatsAppService, WhatsAppKeepAlive],
})
export class WhatsAppModule {}

