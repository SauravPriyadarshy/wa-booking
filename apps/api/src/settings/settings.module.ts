import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../common/auth/roles.guard';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController],
  providers: [PrismaService, SettingsService, RolesGuard],
})
export class SettingsModule {}

