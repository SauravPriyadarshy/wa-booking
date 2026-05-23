import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  controllers: [LeadsController],
  providers: [PrismaService, LeadsService],
})
export class LeadsModule {}

