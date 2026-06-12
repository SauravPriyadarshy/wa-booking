"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";

type Code = {
  id: string;
  code: string;
  plan: string;
  validityDays: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  note: string | null;
};

export default function SuperAdminPlansPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState<"FREE" | "PLUS" | "PRO">("PLUS");
  const [validityDays, setValidityDays] = useState(30);
  const [maxUses, setMaxUses] = useState(10);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${apiBase()}/superadmin/activation-codes`, {
      headers: { authorization: `Bearer ${token}` },
    });
    setCodes((await res.json()) as Code[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${apiBase()}/superadmin/activation-codes`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, plan, validityDays, maxUses, note: note || undefined }),
    });
    if (!res.ok) {
      setError("Could not create code");
      return;
    }
    setCode("");
    setNote("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/superadmin" className="text-[13px] font-medium text-emerald-700">← Super Admin</Link>
        <h1 className="mt-1 text-xl font-semibold">Plans & Activation Codes</h1>
        <p className="text-[13px] text-zinc-500">Generate FREE30 · PLUS90 · PRO60 style codes</p>
      </div>

      <form onSubmit={createCode} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[13px]">
            Code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PLUS90"
              className="h-10 rounded-xl border border-zinc-200 px-3"
              required
            />
          </label>
          <label className="grid gap-1 text-[13px]">
            Plan
            <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} className="h-10 rounded-xl border border-zinc-200 px-3">
              <option value="FREE">Free</option>
              <option value="PLUS">Plus</option>
              <option value="PRO">Pro</option>
            </select>
          </label>
          <label className="grid gap-1 text-[13px]">
            Validity (days)
            <input type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} className="h-10 rounded-xl border border-zinc-200 px-3" />
          </label>
          <label className="grid gap-1 text-[13px]">
            Max uses
            <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} className="h-10 rounded-xl border border-zinc-200 px-3" />
          </label>
        </div>
        <label className="mt-3 grid gap-1 text-[13px]">
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3" />
        </label>
        {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}
        <button type="submit" className="mt-4 h-10 rounded-xl bg-emerald-600 px-4 text-[14px] font-bold text-white">
          Create code
        </button>
      </form>

      {loading ? (
        <p className="text-[14px] text-zinc-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 text-[13px]">
              <div>
                <span className="font-bold">{c.code}</span>
                <span className="ml-2 text-zinc-500">{c.plan} · {c.validityDays}d · {c.usedCount}/{c.maxUses} used</span>
                {c.note ? <div className="text-[11px] text-zinc-400">{c.note}</div> : null}
              </div>
              <span className={c.isActive ? "text-emerald-600" : "text-zinc-400"}>{c.isActive ? "Active" : "Off"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
