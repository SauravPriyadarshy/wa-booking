import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesModule } from '../queues/queues.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpDeliveryService } from './otp-delivery.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    QueuesModule,
    WhatsAppModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [PrismaService, AuthService, OtpDeliveryService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

