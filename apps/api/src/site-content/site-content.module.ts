import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../common/auth/roles.guard';
import { QueuesModule } from '../queues/queues.module';
import { SiteContentController } from './site-content.controller';
import { SiteContentService } from './site-content.service';

@Module({
  imports: [QueuesModule],
  controllers: [SiteContentController],
  providers: [PrismaService, SiteContentService, RolesGuard],
  exports: [SiteContentService],
})
export class SiteContentModule {}
