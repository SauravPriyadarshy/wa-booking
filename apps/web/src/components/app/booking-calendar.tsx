"use client";

import { Card } from "@/components/ui";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function monthLabel(y: number, m: number) {
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function padCell(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function buildMonthCells(y: number, m: number): (number | null)[] {
  const firstDow = new Date(y, m - 1, 1).getDay();
  const dim = daysInMonth(y, m);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  return cells;
}

function addMonths(y: number, m: number, delta: number) {
  const d = new Date(y, m - 1 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

type Props = {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  holidayDates: string[];
  visibleStart: { y: number; m: number };
  onVisibleStartChange: (next: { y: number; m: number }) => void;
  todayISO: string;
};

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  holidayDates,
  visibleStart,
  onVisibleStartChange,
  todayISO: today,
}: Props) {
  const hol = new Set(holidayDates);
  const { y, m } = visibleStart;
  const cells = buildMonthCells(y, m);
  const label = monthLabel(y, m);

  return (
    <Card noPad className="mx-auto max-w-[280px] overflow-hidden">
      <div className="flex items-center justify-between gap-1 border-b border-zinc-100 px-2 py-2">
        <button
          type="button"
          aria-label="Previous month"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-base text-zinc-700 tap-highlight-none"
          onClick={() => onVisibleStartChange(addMonths(y, m, -1))}
        >
          ‹
        </button>
        <div className="min-w-0 text-center text-[12px] font-semibold text-zinc-900">{label}</div>
        <button
          type="button"
          aria-label="Next month"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-base text-zinc-700 tap-highlight-none"
          onClick={() => onVisibleStartChange(addMonths(y, m, 1))}
        >
          ›
        </button>
      </div>

      <div className="p-2">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w, i) => (
            <div key={`${w}-${i}`} className="py-0.5 text-[9px] font-semibold uppercase text-zinc-400">
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (cell === null) {
              return <div key={`e-${y}-${m}-${i}`} className="aspect-square min-h-[28px]" />;
            }
            const iso = padCell(y, m, cell);
            const isSel = iso === selectedDate;
            const isToday = iso === today;
            const isHol = hol.has(iso);
            const isPast = iso < today;
            return (
              <button
                key={iso}
                type="button"
                disabled={isPast}
                onClick={() => onSelectDate(iso)}
                className={[
                  "relative flex aspect-square min-h-[28px] items-center justify-center rounded-md text-[11px] font-semibold transition tap-highlight-none",
                  isPast
                    ? "cursor-not-allowed text-zinc-300"
                    : isSel
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-800 hover:bg-emerald-50",
                  !isPast && !isSel && isToday ? "ring-1 ring-emerald-400" : "",
                ].join(" ")}
              >
                {cell}
                {isHol && !isPast ? (
                  <span
                    className={[
                      "absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full",
                      isSel ? "bg-white/90" : "bg-amber-500",
                    ].join(" ")}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
