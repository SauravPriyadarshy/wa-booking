import type { Service } from '@prisma/client';

export type Slot = { startAt: string; endAt: string };

export function generateSlots(args: {
  date: Date; // local date (00:00)
  service: Pick<Service, 'durationMin' | 'bufferBeforeMin' | 'bufferAfterMin'>;
  existing: { startAt: Date; endAt: Date }[];
  workStartHour?: number;
  workEndHour?: number;
  stepMin?: number;
}): Slot[] {
  const workStartHour = args.workStartHour ?? 9;
  const workEndHour = args.workEndHour ?? 18;
  const stepMin = args.stepMin ?? 15;

  const dayStart = new Date(args.date);
  dayStart.setHours(workStartHour, 0, 0, 0);
  const dayEnd = new Date(args.date);
  dayEnd.setHours(workEndHour, 0, 0, 0);

  const dur =
    args.service.durationMin +
    (args.service.bufferBeforeMin ?? 0) +
    (args.service.bufferAfterMin ?? 0);

  const slots: Slot[] = [];
  for (
    let t = new Date(dayStart);
    t.getTime() + dur * 60_000 <= dayEnd.getTime();
    t = new Date(t.getTime() + stepMin * 60_000)
  ) {
    const startAt = new Date(t);
    const endAt = new Date(startAt.getTime() + dur * 60_000);

    const overlaps = args.existing.some(
      (a) => startAt < a.endAt && endAt > a.startAt,
    );
    if (overlaps) continue;

    slots.push({ startAt: startAt.toISOString(), endAt: endAt.toISOString() });
  }
  return slots;
}

