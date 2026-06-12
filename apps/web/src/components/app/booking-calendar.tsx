"use client";

import { Card } from "@/components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function monthLabel(y: number, m: number) {
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
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
    <Card noPad className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2.5 md:px-4">
        <button
          type="button"
          aria-label="Previous month"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg text-zinc-700 shadow-sm tap-highlight-none"
          onClick={() => onVisibleStartChange(addMonths(y, m, -1))}
        >
          ‹
        </button>
        <div className="min-w-0 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Schedule</div>
          <div className="truncate text-[13px] font-semibold text-zinc-900">{label}</div>
        </div>
        <button
          type="button"
          aria-label="Next month"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg text-zinc-700 shadow-sm tap-highlight-none"
          onClick={() => onVisibleStartChange(addMonths(y, m, 1))}
        >
          ›
        </button>
      </div>

      <div className="p-3 md:p-4">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (cell === null) {
              return <div key={`e-${y}-${m}-${i}`} className="aspect-square min-h-[36px] md:min-h-[40px]" />;
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
                  "relative flex aspect-square min-h-[36px] items-center justify-center rounded-lg text-[13px] font-semibold transition tap-highlight-none md:min-h-[40px]",
                  isPast
                    ? "cursor-not-allowed text-zinc-300"
                    : isSel
                      ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200"
                      : "text-zinc-800 hover:bg-zinc-50",
                  !isPast && !isSel && isToday ? "ring-1 ring-emerald-300" : "",
                ].join(" ")}
              >
                {cell}
                {isHol && !isPast ? (
                  <span
                    className={[
                      "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
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
