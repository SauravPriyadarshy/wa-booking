"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  CustomerCardSkeleton,
  EmptyState,
  FormField,
  FieldInput,
} from "@/components/ui";

type Customer = {
  id: string;
  name: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const schema = z.object({
  name: z.string().min(2, "Enter name"),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Filter = "all" | "new" | "inactive";

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledCRM, setEnabledCRM] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: useMemo(() => ({ name: "", phone: "" }), []),
  });

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/customers`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Failed");
      setItems(Array.isArray(data) ? (data as Customer[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const f = searchParams.get("filter");
    if (f === "inactive" || f === "new") setFilter(f);
    else if (f === "all") setFilter("all");
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } });
        const data = await res.json();
        const enabled: string[] = data?.business?.enabledFeatures ?? [];
        setEnabledCRM(enabled.includes("crm") || enabled.length === 0);
      } catch {
        setEnabledCRM(true);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = items;
    if (needle) {
      list = list.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(needle) ||
          (c.phone ?? "").toLowerCase().includes(needle),
      );
    }
    const now = new Date();
    if (filter === "new") {
      list = list.filter((c) => daysBetween(new Date(c.createdAt), now) <= 14);
    }
    if (filter === "inactive") {
      list = list.filter((c) => daysBetween(new Date(c.updatedAt), now) >= 45);
    }
    return list;
  }, [items, q, filter]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/customers`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Failed");
      form.reset({ name: "", phone: "" });
      setSheetOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!enabledCRM) {
    return (
      <div className="px-4 py-6">
        <Card className="!p-5">
          <div className="text-[15px] font-semibold text-zinc-900">CRM is disabled</div>
          <p className="mt-2 text-[13px] text-zinc-600">Ask your admin to turn on the CRM feature.</p>
          <a
            href="/app"
            className="mt-4 flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-[14px] font-semibold text-white"
          >
            Back to Hub
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <div className="flex items-center justify-between gap-2">
        <a href="/app" className="text-[13px] font-semibold text-emerald-700">
          ← Hub
        </a>
        <a href="/app/settings" className="text-[12px] font-semibold text-zinc-500">
          Settings
        </a>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-zinc-900">Customers</h1>
          <p className="text-[12px] text-zinc-500">{items.length} total</p>
        </div>
        <Button type="button" variant="primary" size="md" onClick={() => setSheetOpen(true)}>
          + Add
        </Button>
      </div>

      <div className="mt-3">
        <FieldInput
          placeholder="Search name or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ["all", "All"],
            ["new", "New"],
            ["inactive", "Inactive"],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} label={label} active={filter === id} onClick={() => setFilter(id)} />
        ))}
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {loading ? (
          <>
            <CustomerCardSkeleton />
            <CustomerCardSkeleton />
            <CustomerCardSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title={q || filter !== "all" ? "No matches" : "No customers yet"}
            description="Add walk-ins and regulars — they power WhatsApp and bookings."
            action={
              <Button type="button" variant="primary" size="md" onClick={() => setSheetOpen(true)}>
                Add customer
              </Button>
            }
          />
        ) : (
          filtered.map((c) => (
            <a key={c.id} href={`/app/customers/${c.id}`} className="block tap-highlight-none">
              <Card className="!p-4 transition-colors hover:border-emerald-100 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-zinc-900">{c.name ?? "Customer"}</div>
                    <div className="text-[12px] text-zinc-500">{c.phone ?? "No phone"}</div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      Updated {new Date(c.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <span className="shrink-0 text-zinc-300">›</span>
                </div>
              </Card>
            </a>
          ))
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="New customer">
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Name" required error={form.formState.errors.name?.message}>
            <FieldInput placeholder="Full name" {...form.register("name")} />
          </FormField>
          <FormField label="Phone" error={form.formState.errors.phone?.message}>
            <FieldInput placeholder="+91 …" inputMode="tel" {...form.register("phone")} />
          </FormField>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving}>
            Save customer
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
