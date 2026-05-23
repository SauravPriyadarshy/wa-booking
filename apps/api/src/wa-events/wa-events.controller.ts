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

@Controller('wa')
export class WaEventsController {
  constructor(private wa: WaEventsService) {}

  @Post('events')
  async ingest(@Headers('x-worker-secret') secret: string | undefined, @Body() evt: WaIncomingMessageEvent) {
    return this.wa.ingest(secret, evt);
  }
}

