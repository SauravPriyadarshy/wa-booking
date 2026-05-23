"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type PaymentConfig = { id: string; upiId: string | null; upiQrUrl: string | null; allowCash: boolean };
type PendingPayment = {
  id: string;
  method: string;
  amountCents: number | null;
  proofUrl: string | null;
  createdAt: string;
  appointment: {
    id: string;
    startAt: string;
    status: string;
    customer: { name: string | null; phone: string | null };
    service: { name: string };
  };
};

const configSchema = z.object({
  upiId: z.string().optional(),
  upiQrUrl: z.string().url("Must be a URL").optional().or(z.literal("")),
  allowCash: z.boolean().optional(),
});
type ConfigForm = z.infer<typeof configSchema>;

export default function PaymentsPage() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function load() {
    if (!token) return;
    setErr(null);
    const [cfg, pend] = await Promise.all([
      fetch(`${apiBase()}/payments/config`, { headers: { authorization: `Bearer ${token}` } }),
      fetch(`${apiBase()}/payments/pending`, { headers: { authorization: `Bearer ${token}` } }),
    ]);
    const cfgJson = await cfg.text().then((t) => (t ? JSON.parse(t) : null));
    if (!cfg.ok) throw new Error(cfgJson?.message ?? "Failed to load config");
    setConfig(cfgJson as PaymentConfig | null);
    const pendJson = await pend.text().then((t) => (t ? JSON.parse(t) : []));
    if (!pend.ok) throw new Error(pendJson?.message ?? "Failed to load pending");
    setPending(pendJson as PendingPayment[]);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: { upiId: "", upiQrUrl: "", allowCash: true },
  });

  useEffect(() => {
    if (!config) return;
    form.reset({ upiId: config.upiId ?? "", upiQrUrl: config.upiQrUrl ?? "", allowCash: config.allowCash });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id]);

  async function save(values: ConfigForm) {
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase()}/payments/config`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          upiId: values.upiId?.trim() || undefined,
          upiQrUrl: values.upiQrUrl?.trim() || undefined,
          allowCash: values.allowCash ?? true,
        }),
      });
      const json = await res.text().then((t) => (t ? JSON.parse(t) : {}));
      if (!res.ok) throw new Error(json?.message ?? "Failed to save");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function verify(id: string) {
    if (!token) return;
    setErr(null);
    try {
      const res = await fetch(`${apiBase()}/payments/${id}/verify`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.text().then((t) => (t ? JSON.parse(t) : {}));
      if (!res.ok) throw new Error(json?.message ?? "Failed to verify");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="text-sm text-zinc-500">Payments</div>
      <div className="mt-2 text-xs text-zinc-500">Manual verification (UPI / Cash).</div>

      {err ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-700">{err}</div> : null}

      <div className="mt-3 grid gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-semibold">Payment settings</div>
          <form className="mt-3 grid gap-2" onSubmit={form.handleSubmit(save)}>
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="UPI ID (optional) e.g. shop@upi"
              {...form.register("upiId")}
            />
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="UPI QR image URL (optional)"
              {...form.register("upiQrUrl")}
            />
            {form.formState.errors.upiQrUrl ? (
              <div className="text-xs text-red-600">{form.formState.errors.upiQrUrl.message}</div>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" {...form.register("allowCash")} />
              Allow cash
            </label>
            <button
              disabled={busy}
              className="mt-1 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              type="submit"
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-semibold">Pending verification ({pending.length})</div>
          {pending.length === 0 ? (
            <div className="mt-2 text-xs text-zinc-500">No pending payments.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              {pending.map((p) => (
                <div key={p.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="text-sm font-semibold">{p.appointment.service.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-600">
                    {p.appointment.customer.phone ?? "No phone"} • {p.method}
                    {p.amountCents != null ? ` • ₹${(p.amountCents / 100).toFixed(0)}` : ""}
                  </div>
                  {p.proofUrl ? (
                    <a className="mt-2 block text-xs text-emerald-700 underline" href={p.proofUrl} target="_blank">
                      View proof
                    </a>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => verify(p.id)}
                      className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

