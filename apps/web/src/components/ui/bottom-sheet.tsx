"use client";

import { useEffect, useRef, ReactNode, useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? null;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragStartY.current == null) return;
      const y = e.touches[0]?.clientY ?? dragStartY.current;
      const dy = y - dragStartY.current;
      if (dy > 72) {
        dragStartY.current = null;
        onClose();
      }
    },
    [onClose],
  );

  const onTouchEnd = useCallback(() => {
    dragStartY.current = null;
  }, []);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[min(640px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex cursor-grab justify-center bg-white pb-1 pt-3 active:cursor-grabbing touch-pan-y md:hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>
        {title ? (
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
            <span className="text-[15px] font-semibold text-zinc-900">{title}</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="overflow-y-auto px-5 py-4 pb-safe">{children}</div>
      </div>
    </div>
  );
}
