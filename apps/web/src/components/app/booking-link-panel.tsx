"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui";

type ApiFn = (path: string, init?: RequestInit) => Promise<unknown>;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Props = {
  bookingUrl: string;
  businessName: string;
  slug: string;
  canRegenerateSlug: boolean;
  api: ApiFn;
  onUiRefresh: () => Promise<void>;
};

export function BookingLinkPanel({
  bookingUrl,
  businessName,
  slug,
  canRegenerateSlug,
  api,
  onUiRefresh,
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(true);
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenStep, setRegenStep] = useState<"idle" | "confirm">("idle");

  useEffect(() => {
    let cancelled = false;
    setQrBusy(true);
    import("qrcode")
      .then((QR) =>
        QR.default.toDataURL(bookingUrl, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#064e3b", light: "#ffffff" },
        }),
      )
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      })
      .finally(() => {
        if (!cancelled) setQrBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingUrl]);

  const copyLink = useCallback(() => {
    void navigator.clipboard.writeText(bookingUrl).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy"),
    );
  }, [bookingUrl]);

  const shareBooking = useCallback(async () => {
    const title = `Book ${businessName || "online"}`;
    const text = `Book a service: ${bookingUrl}`;

    let file: File | undefined;
    if (qrDataUrl) {
      try {
        const blob = await (await fetch(qrDataUrl)).blob();
        file = new File([blob], `${slug}-booking-qr.png`, { type: "image/png" });
      } catch {
        /* ignore */
      }
    }

    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text, url: bookingUrl, files: [file] });
        return;
      }
    } catch {
      /* fall through */
    }

    try {
      await navigator.share({ title, text, url: bookingUrl });
    } catch {
      copyLink();
    }
  }, [bookingUrl, businessName, copyLink, qrDataUrl, slug]);

  const printPoster = useCallback(() => {
    if (!qrDataUrl) {
      toast.error("QR is still loading");
      return;
    }
    const w = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!w) {
      toast.error("Allow pop-ups to print the poster");
      return;
    }
    const title = escapeHtml(businessName || "Book online");
    const urlEsc = escapeHtml(bookingUrl);
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Booking — ${title}</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:32px;color:#111;}
        h1{font-size:22px;margin:0 0 8px;}
        .sub{font-size:14px;color:#444;margin-bottom:24px;}
        img{width:280px;height:280px;}
        .url{font-size:13px;margin-top:20px;word-break:break-all;color:#065f46;}
        @media print { body { padding: 12px; } .noprint { display: none !important; } }
      </style></head><body>
      <h1>${title}</h1>
      <p class="sub">Scan to book a service</p>
      <img src="${qrDataUrl}" alt="" width="280" height="280" />
      <p class="url">${urlEsc}</p>
      <p class="noprint" style="margin-top:24px;font-size:12px;color:#666">Print this page (or Save as PDF) for your shop window.</p>
      <button type="button" class="noprint" style="margin-top:16px;padding:10px 20px;border-radius:10px;border:none;background:#059669;color:#fff;font-size:14px;font-weight:600;cursor:pointer" onclick="window.print()">Print</button>
      </body></html>`);
    w.document.close();
    w.focus();
  }, [bookingUrl, businessName, qrDataUrl]);

  const doRegenerate = useCallback(async () => {
    setRegenBusy(true);
    try {
      await api("/businesses/me/regenerate-booking-slug", { method: "POST" });
      await onUiRefresh();
      setRegenStep("idle");
      toast.success("New booking link and QR are ready. Old links and QR codes no longer work.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create a new link");
    } finally {
      setRegenBusy(false);
    }
  }, [api, onUiRefresh]);

  return (
    <div className="mt-5 rounded-2xl bg-emerald-600 p-4 text-white shadow-md shadow-emerald-900/10">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-white/95">Booking link</div>
          <div className="mt-0.5 text-[11px] text-white/75">Customers book in under a minute.</div>
        </div>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="shrink-0 rounded-xl bg-white/20 px-3 py-2 text-[11px] font-semibold backdrop-blur transition hover:bg-white/30 tap-highlight-none"
        >
          Copy
        </button>
      </div>

      <div className="mt-2 truncate rounded-lg bg-black/10 px-2 py-1.5 font-mono text-[10px] text-white/90">{bookingUrl}</div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          {qrBusy ? (
            <div className="flex h-[200px] w-[200px] items-center justify-center text-[12px] font-medium text-zinc-400">
              Generating QR…
            </div>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code linking to your public booking page" width={200} height={200} className="block" />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center px-2 text-center text-[11px] font-medium text-red-600">
              Could not create QR. Try refreshing.
            </div>
          )}
        </div>

        <div className="flex w-full max-w-sm flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void shareBooking()}
            disabled={qrBusy}
            className="min-h-10 flex-1 rounded-xl bg-white/20 px-4 py-2 text-[12px] font-semibold backdrop-blur transition hover:bg-white/30 disabled:opacity-50 tap-highlight-none"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => void printPoster()}
            disabled={qrBusy || !qrDataUrl}
            className="min-h-10 flex-1 rounded-xl bg-white/20 px-4 py-2 text-[12px] font-semibold backdrop-blur transition hover:bg-white/30 disabled:opacity-50 tap-highlight-none"
          >
            Print
          </button>
        </div>
      </div>

      {canRegenerateSlug ? (
        <div className="mt-4 border-t border-white/20 pt-3">
          {regenStep === "confirm" ? (
            <div className="rounded-xl bg-black/15 p-3 text-left">
              <p className="text-[11px] leading-snug text-white/95">
                This creates a <span className="font-semibold">new</span> link and QR code. Printed materials with the old
                code will <span className="font-semibold">stop working</span>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={regenBusy}
                  onClick={() => void doRegenerate()}
                  className="min-h-10 flex-1 rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-emerald-900 shadow-sm tap-highlight-none disabled:opacity-60"
                >
                  {regenBusy ? "Working…" : "Create new link"}
                </button>
                <button
                  type="button"
                  disabled={regenBusy}
                  onClick={() => setRegenStep("idle")}
                  className="min-h-10 flex-1 rounded-xl bg-white/15 px-3 py-2 text-[12px] font-semibold text-white tap-highlight-none disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRegenStep("confirm")}
              className="w-full rounded-xl border border-white/30 bg-transparent py-2.5 text-[12px] font-semibold text-white/95 transition hover:bg-white/10 tap-highlight-none"
            >
              Create new booking link…
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
