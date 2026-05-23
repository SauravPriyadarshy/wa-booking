import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';

@Module({
  controllers: [SuperAdminController],
  providers: [PrismaService, SuperAdminService],
})
export class SuperAdminModule {}

