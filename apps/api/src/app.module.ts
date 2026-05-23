import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { CategoriesModule } from './categories/categories.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ServicesModule } from './services/services.module';
import { CustomersModule } from './customers/customers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { StaffModule } from './staff/staff.module';
import { SettingsModule } from './settings/settings.module';
import { SuperAdminModule } from './superadmin/superadmin.module';
import { MeModule } from './me/me.module';
import { QuickRepliesModule } from './quick-replies/quick-replies.module';
import { LeadsModule } from './leads/leads.module';
import { SupportModule } from './support/support.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HubModule } from './hub/hub.module';
import { PublicModule } from './public/public.module';
import { WaEventsModule } from './wa-events/wa-events.module';
import { ConversationsModule } from './conversations/conversations.module';
import { QueuesModule } from './queues/queues.module';
import { SiteContentModule } from './site-content/site-content.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting — 60 req/min global; specific endpoints override via @Throttle()
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    // Cron / scheduled jobs
    ScheduleModule.forRoot(),
    // Redis + BullMQ queues (exported for injection across modules)
    QueuesModule,
    // Dynamic site content (landing, SEO, WA templates)
    SiteContentModule,
    AuthModule,
    CategoriesModule,
    BusinessesModule,
    ServicesModule,
    CustomersModule,
    AppointmentsModule,
    WhatsAppModule,
    StaffModule,
    SettingsModule,
    SuperAdminModule,
    MeModule,
    QuickRepliesModule,
    LeadsModule,
    SupportModule,
    PaymentsModule,
    AnalyticsModule,
    HubModule,
    WaEventsModule,
    ConversationsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // Apply throttle guard globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
