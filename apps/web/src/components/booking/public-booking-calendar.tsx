"use client";

import { useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
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

function monthLabel(y: number, m: number) {
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

type Props = {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  todayISO: string;
  minDate?: string;
  maxDate?: string;
};

export function PublicBookingCalendar({
  selectedDate,
  onSelectDate,
  todayISO,
  minDate = todayISO,
  maxDate,
}: Props) {
  const initial = selectedDate || todayISO;
  const [y0, m0] = initial.split("-").map(Number);
  const [visible, setVisible] = useState({ y: y0, m: m0 });

  const cells = buildMonthCells(visible.y, visible.m);
  const label = monthLabel(visible.y, visible.m);

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-lg text-zinc-700"
          onClick={() => setVisible((v) => addMonths(v.y, v.m, -1))}
        >
          ‹
        </button>
        <div className="min-w-0 text-center">
          <div className="text-[14px] font-bold text-zinc-900">{label}</div>
        </div>
        <button
          type="button"
          aria-label="Next month"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-lg text-zinc-700"
          onClick={() => setVisible((v) => addMonths(v.y, v.m, 1))}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (cell === null) {
            return <div key={`e-${i}`} className="aspect-square min-h-[36px]" />;
          }
          const iso = padCell(visible.y, visible.m, cell);
          const isPast = iso < minDate;
          const isFuture = maxDate ? iso > maxDate : false;
          const disabled = isPast || isFuture;
          const isSel = iso === selectedDate;
          const isToday = iso === todayISO;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(iso)}
              className={[
                "relative flex aspect-square min-h-[36px] items-center justify-center rounded-lg text-[13px] font-semibold transition",
                disabled
                  ? "cursor-not-allowed text-zinc-300"
                  : isSel
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-zinc-800 hover:bg-emerald-50",
                !disabled && !isSel && isToday ? "ring-1 ring-emerald-400" : "",
              ].join(" ")}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </div>
  );
}
