import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../common/auth/roles.guard';
import { AutomationModule } from '../automation/automation.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AutomationModule],
  controllers: [SettingsController],
  providers: [PrismaService, SettingsService, RolesGuard],
})
export class SettingsModule {}

