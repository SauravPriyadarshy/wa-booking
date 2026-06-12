import { Injectable, NotFoundException } from '@nestjs/common';
import { getSimulator, listSuccessCards, resolveSimulatorKey } from '../common/business-success-data';

@Injectable()
export class BusinessSuccessService {
  listTypes() {
    return { ok: true, types: listSuccessCards() };
  }

  getSimulator(cardKey: string) {
    const simulatorKey = resolveSimulatorKey(cardKey);
    const data = getSimulator(simulatorKey);
    if (!data) throw new NotFoundException('Simulator not found');
    return { ok: true, cardKey, simulatorKey, ...data };
  }
}
