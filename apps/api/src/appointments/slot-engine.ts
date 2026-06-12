import type { Service } from '@prisma/client';

export type Slot = { startAt: string; endAt: string };

export type SlotOption = Slot & {
  available: boolean;
  reason?: 'past' | 'booked';
};

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function generateSlotOptions(args: {
  date: Date; // local date (00:00)
  service: Pick<Service, 'durationMin' | 'bufferBeforeMin' | 'bufferAfterMin'>;
  existing: { startAt: Date; endAt: Date }[];
  workStartHour?: number;
  workEndHour?: number;
  stepMin?: number;
  now?: Date;
}): SlotOption[] {
  const workStartHour = args.workStartHour ?? 9;
  const workEndHour = args.workEndHour ?? 18;
  const stepMin = args.stepMin ?? 15;
  const now = args.now ?? new Date();

  const dayStart = new Date(args.date);
  dayStart.setHours(workStartHour, 0, 0, 0);
  const dayEnd = new Date(args.date);
  dayEnd.setHours(workEndHour, 0, 0, 0);

  const dayOnly = new Date(args.date);
  dayOnly.setHours(0, 0, 0, 0);
  const todayOnly = new Date(now);
  todayOnly.setHours(0, 0, 0, 0);
  const isPastDay = dayOnly.getTime() < todayOnly.getTime();
  const isToday = isSameLocalDay(dayOnly, now);

  const dur =
    args.service.durationMin +
    (args.service.bufferBeforeMin ?? 0) +
    (args.service.bufferAfterMin ?? 0);

  const slots: SlotOption[] = [];
  for (
    let t = new Date(dayStart);
    t.getTime() + dur * 60_000 <= dayEnd.getTime();
    t = new Date(t.getTime() + stepMin * 60_000)
  ) {
    const startAt = new Date(t);
    const endAt = new Date(startAt.getTime() + dur * 60_000);

    const booked = args.existing.some((a) => startAt < a.endAt && endAt > a.startAt);
    const past = isPastDay || (isToday && startAt.getTime() <= now.getTime());

    if (booked) {
      slots.push({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        available: false,
        reason: 'booked',
      });
      continue;
    }
    if (past) {
      slots.push({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        available: false,
        reason: 'past',
      });
      continue;
    }

    slots.push({
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      available: true,
    });
  }
  return slots;
}

/** Backward-compatible: available slots only. */
export function generateSlots(args: {
  date: Date;
  service: Pick<Service, 'durationMin' | 'bufferBeforeMin' | 'bufferAfterMin'>;
  existing: { startAt: Date; endAt: Date }[];
  workStartHour?: number;
  workEndHour?: number;
  stepMin?: number;
  now?: Date;
}): Slot[] {
  return generateSlotOptions(args)
    .filter((s) => s.available)
    .map(({ startAt, endAt }) => ({ startAt, endAt }));
}
