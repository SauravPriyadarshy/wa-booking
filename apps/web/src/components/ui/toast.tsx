"use client";

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";
interface ToastItem { id: number; type: ToastType; message: string; }

const ToastContext = createContext<(type: ToastType, msg: string) => void>(() => {});

let _add: ((type: ToastType, msg: string) => void) | null = null;

export function useToast() {
  return useContext(ToastContext);
}

// Imperative API — usable outside React trees
export const toast = {
  success: (msg: string) => _add?.("success", msg),
  error:   (msg: string) => _add?.("error", msg),
  info:    (msg: string) => _add?.("info", msg),
  warning: (msg: string) => _add?.("warning", msg),
};

const typeStyles: Record<ToastType, string> = {
  success: "bg-emerald-600 text-white",
  error:   "bg-red-600 text-white",
  info:    "bg-blue-600 text-white",
  warning: "bg-amber-500 text-white",
};

const typeIcons: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
  warning: "⚠",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let counter = 0;

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++counter;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { _add = add; return () => { _add = null; }; }, [add]);

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="pointer-events-none fixed z-[100] flex max-w-[min(100vw-2rem,24rem)] flex-col items-end gap-2 max-md:bottom-24 max-md:left-1/2 max-md:w-[calc(100vw-2rem)] max-md:-translate-x-1/2 max-md:items-center md:bottom-auto md:left-auto md:right-4 md:top-4 md:translate-x-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg text-[13px] font-semibold ${typeStyles[t.type]}`}
          >
            <span className="text-sm">{typeIcons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
