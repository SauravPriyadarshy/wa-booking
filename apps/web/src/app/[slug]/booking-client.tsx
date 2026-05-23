"use client";

import { use, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Button, FormField, FieldInput } from "@/components/ui";

type Service = { id: string; name: string; durationMin: number; priceCents: number | null };
type Business = { id: string; name: string; slug: string; services: Service[] };
type Slot = { startAt: string; endAt: string };

function addDaysISO(base: string, days: number) {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDayChip(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

export default function BookingClient({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(paramsPromise);
  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const weekDates = useMemo(() => {
    const t = new Date().toISOString().slice(0, 10);
    return Array.from({ length: 7 }, (_, i) => addDaysISO(t, i));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/public/business/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Business not found");
        setBusiness(data as Business);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (step === 2 && service) {
      (async () => {
        try {
          setSlots([]);
          const res = await fetch(
            `${apiBase()}/public/business/${slug}/slots?serviceId=${service.id}&date=${encodeURIComponent(date)}`,
          );
          const data = await res.json();
          setSlots(Array.isArray(data) ? data : []);
        } catch {
          setSlots([]);
        }
      })();
    }
  }, [step, service, date, slug]);

  async function book() {
    if (!service || !slot || !name || !phone) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase()}/public/business/${slug}/book`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, startAt: slot.startAt, name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Booking failed");
      setStep(4);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="mx-auto max-w-md space-y-3">
          <div className="h-28 animate-pulse rounded-2xl bg-emerald-100/60" />
          <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }
  if (err && step === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <p className="text-center text-[15px] text-red-700">{err}</p>
      </div>
    );
  }
  if (!business) return null;

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-white shadow-sm">
        <header className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 pb-8 pt-10 text-white">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-white/80">Book in under a minute</p>
          <h1 className="mt-1 text-[22px] font-semibold leading-tight">{business.name}</h1>
          <p className="mt-2 text-[13px] text-white/85">Pick a service, time, and your phone — we&apos;ll confirm on WhatsApp.</p>
        </header>

        <div className="px-5 py-6">
          <div className="mb-6 flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${step === s ? "bg-emerald-500" : step > s ? "bg-emerald-200" : "bg-zinc-100"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <section>
              <h2 className="text-[17px] font-semibold text-zinc-900">Select service</h2>
              <div className="mt-3 grid gap-2">
                {business.services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setService(s);
                      setStep(2);
                    }}
                    className="flex min-h-[52px] items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[0.99]"
                  >
                    <div>
                      <div className="text-[15px] font-semibold text-zinc-900">{s.name}</div>
                      <div className="text-[12px] text-zinc-500">{s.durationMin} min</div>
                    </div>
                    {s.priceCents != null ? (
                      <div className="text-[14px] font-semibold text-emerald-700">₹{Math.round(s.priceCents / 100)}</div>
                    ) : (
                      <span className="text-[12px] text-zinc-400">—</span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && service && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold text-zinc-900">Pick date &amp; time</h2>
                <button type="button" onClick={() => setStep(1)} className="text-[12px] font-semibold text-emerald-700">
                  Change service
                </button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {weekDates.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setDate(iso)}
                    className={`flex min-w-[4.5rem] flex-col items-center rounded-xl border px-2 py-2 text-[12px] font-semibold transition ${
                      date === iso
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    <span>{formatDayChip(iso)}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.startAt}
                    type="button"
                    onClick={() => {
                      setSlot(s);
                      setStep(3);
                    }}
                    className="min-h-11 rounded-xl border border-zinc-100 bg-zinc-50 py-2 text-center text-[13px] font-semibold text-zinc-900 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    {new Date(s.startAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </button>
                ))}
                {!slots.length ? (
                  <p className="col-span-3 py-8 text-center text-[13px] text-zinc-500">No open slots this day. Try another date.</p>
                ) : null}
              </div>
            </section>
          )}

          {step === 3 && service && slot && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold text-zinc-900">Your details</h2>
                <button type="button" onClick={() => setStep(2)} className="text-[12px] font-semibold text-emerald-700">
                  Change time
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Summary</p>
                <p className="mt-1 text-[15px] font-semibold text-zinc-900">{service.name}</p>
                <p className="mt-1 text-[13px] text-zinc-600">
                  {new Date(slot.startAt).toLocaleString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="mt-5 grid gap-4">
                <FormField label="Your name" required>
                  <FieldInput placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                </FormField>
                <FormField label="Phone" required>
                  <FieldInput placeholder="+91 …" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </FormField>
                {err ? <p className="text-[13px] text-red-600">{err}</p> : null}
                <Button type="button" variant="primary" size="lg" className="w-full" loading={busy} disabled={!name.trim() || !phone.trim()} onClick={() => void book()}>
                  Confirm booking
                </Button>
              </div>
            </section>
          )}

          {step === 4 && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-[22px] font-semibold text-zinc-900">You&apos;re booked!</h2>
              <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-zinc-600">
                Thanks, {name}. We&apos;ll send a WhatsApp reminder when your slot is near.
              </p>

              {/* WhatsApp share button */}
              {business && (
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `I just booked at ${business.name}! Book your appointment here: ${typeof window !== "undefined" ? window.location.href : ""}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#20bd5a] active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.1 1.523 5.824L.057 23.386l5.73-1.503A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.512-5.234-1.406l-.374-.222-3.4.892.907-3.314-.243-.388A9.955 9.955 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" />
                  </svg>
                  Share on WhatsApp
                </a>
              )}

              <p className="mt-4 text-[12px] text-zinc-500">Add this to your calendar from your phone if you like.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 text-[14px] font-semibold text-emerald-700"
              >
                Book another visit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
