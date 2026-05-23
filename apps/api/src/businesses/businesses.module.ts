import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

@Module({
  controllers: [BusinessesController],
  providers: [PrismaService, BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}

