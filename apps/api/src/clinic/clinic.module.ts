import { Module } from '@nestjs/common';
import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ClinicController],
  providers: [ClinicService, PrismaService],
  exports: [ClinicService],
})
export class ClinicModule {}
