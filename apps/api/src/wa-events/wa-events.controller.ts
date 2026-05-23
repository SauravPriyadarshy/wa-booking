import { Body, Controller, Headers, Post } from '@nestjs/common';
import { WaEventsService } from './wa-events.service';

type WaIncomingMessageEvent = {
  type: 'message';
  businessId: string;
  waMessageId?: string;
  fromPhone?: string;
  fromName?: string;
  direction: 'IN' | 'OUT';
  body: string;
  timestampMs?: number;
};

type BookingActionBody = {
  appointmentId: string;
  action: 'CONFIRM' | 'CANCEL';
  businessId: string;
};

@Controller('wa')
export class WaEventsController {
  constructor(private wa: WaEventsService) {}

  @Post('events')
  async ingest(@Headers('x-worker-secret') secret: string | undefined, @Body() evt: WaIncomingMessageEvent) {
    return this.wa.ingest(secret, evt);
  }

  @Post('booking-action')
  async bookingAction(
    @Headers('x-worker-secret') secret: string | undefined,
    @Body() body: BookingActionBody,
  ) {
    return this.wa.handleBookingAction(secret, body);
  }
}

