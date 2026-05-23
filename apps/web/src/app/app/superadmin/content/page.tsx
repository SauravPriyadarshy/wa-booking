"use client";

import { useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";

type ContentRow = {
  id: string;
  key: string;
  locale: string;
  group: string;
  label: string;
  value: string;
  updatedBy?: string;
  updatedAt: string;
};

type GroupedRows = Record<string, ContentRow[]>;

const GROUP_LABELS: Record<string, string> = {
  landing: "Landing Page",
  seo: "SEO Metadata",
  wa_templates: "WhatsApp Templates",
  city: "City Landing Pages",
  onboarding: "Onboarding",
};

const LOCALES = ["en", "hi"];

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function fetchAll(group?: string, locale?: string): Promise<ContentRow[]> {
  const params = new URLSearchParams();
  if (group) params.set("group", group);
  if (locale) params.set("locale", locale);
  const res = await fetch(`${apiBase()}/site-content/all?${params}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error((await res.json() as any)?.message ?? "Failed to load content");
  return res.json();
}

async function updateKey(key: string, locale: string, value: string): Promise<void> {
  const res = await fetch(
    `${apiBase()}/site-content/key/${encodeURIComponent(key)}?locale=${locale}`,
    {
      method: "PUT",
      headers: { ...authHeader(), "content-type": "application/json" },
      body: JSON.stringify({ value }),
    },
  );
  if (!res.ok) throw new Error((await res.json() as any)?.message ?? "Save failed");
}

function isJson(str: string) {
  try { JSON.parse(str); return true; } catch { return false; }
}

function ContentEditor({ row, onSaved }: { row: ContentRow; onSaved: () => void }) {
  const [value, setValue] = useState(row.value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isJsonValue = isJson(row.value);
  const isMultiline = row.value.includes("\n") || isJsonValue || row.value.length > 120;

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await updateKey(row.key, row.locale, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = value !== row.value;

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-zinc-900">{row.label}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600">{row.key}</code>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${row.locale === "hi" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
              {row.locale.toUpperCase()}
            </span>
            {isJsonValue && (
              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">JSON</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <span className="text-[12px] font-semibold text-emerald-600">✓ Saved</span>}
          {isDirty && !saving && (
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Save
            </button>
          )}
          {saving && <span className="text-[12px] text-zinc-500">Saving…</span>}
        </div>
      </div>

      <div className="mt-3">
        {isMultiline ? (
          <textarea
            rows={isJsonValue ? 8 : 4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[12px] leading-relaxed text-zinc-800 transition focus:border-emerald-400 focus:bg-white focus:outline-none"
            spellCheck={false}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-800 transition focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        )}
        {err && <p className="mt-1 text-[12px] text-red-600">{err}</p>}
        {row.updatedAt && (
          <p className="mt-1 text-[11px] text-zinc-400">
            Last saved: {new Date(row.updatedAt).toLocaleString("en-IN")}
            {row.updatedBy ? ` by ${row.updatedBy}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminContentPage() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterLocale, setFilterLocale] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchAll()
      .then((data) => { setRows(data); setErr(null); })
      .catch((e) => setErr(e.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [refreshTick]);

  const allGroups = useMemo(() => [...new Set(rows.map((r) => r.group))].sort(), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterGroup !== "all" && r.group !== filterGroup) return false;
      if (filterLocale !== "all" && r.locale !== filterLocale) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.key.includes(q) && !r.label.toLowerCase().includes(q) && !r.value.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterGroup, filterLocale, search]);

  const grouped = useMemo<GroupedRows>(() => {
    const g: GroupedRows = {};
    for (const row of filtered) {
      if (!g[row.group]) g[row.group] = [];
      g[row.group].push(row);
    }
    return g;
  }, [filtered]);

  const groupKeys = Object.keys(grouped).sort();

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app/superadmin" className="text-[13px] font-semibold text-emerald-700">
        ← Super Admin
      </a>
      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">Content Editor</h1>
      <p className="mt-1 text-[13px] text-zinc-500">
        Edit all user-facing text, SEO metadata, WhatsApp templates, and city pages. Changes go live within 5 minutes (Redis cache).
      </p>

      {err && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{err}</div>
      )}

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search keys, labels, values…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 min-w-[180px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] focus:border-emerald-400 focus:outline-none"
        />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px] focus:border-emerald-400 focus:outline-none"
        >
          <option value="all">All groups</option>
          {allGroups.map((g) => (
            <option key={g} value={g}>{GROUP_LABELS[g] ?? g}</option>
          ))}
        </select>
        <select
          value={filterLocale}
          onChange={(e) => setFilterLocale(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px] focus:border-emerald-400 focus:outline-none"
        >
          <option value="all">All languages</option>
          {LOCALES.map((l) => (
            <option key={l} value={l}>{l === "en" ? "English" : "Hindi"}</option>
          ))}
        </select>
      </div>

      <div className="mt-2 text-[12px] text-zinc-400">
        {filtered.length} of {rows.length} keys
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {groupKeys.map((group) => (
            <section key={group}>
              <h2 className="sticky top-0 z-10 -mx-4 border-b border-zinc-100 bg-zinc-50/90 px-4 py-2 text-[14px] font-semibold text-zinc-700 backdrop-blur">
                {GROUP_LABELS[group] ?? group}
                <span className="ml-2 text-[12px] font-normal text-zinc-400">({grouped[group].length} keys)</span>
              </h2>
              <div className="mt-3 space-y-3">
                {grouped[group].map((row) => (
                  <ContentEditor
                    key={`${row.key}:${row.locale}`}
                    row={row}
                    onSaved={() => setRefreshTick((t) => t + 1)}
                  />
                ))}
              </div>
            </section>
          ))}

          {groupKeys.length === 0 && (
            <div className="py-12 text-center text-[14px] text-zinc-400">
              {search ? "No matching content keys." : "No content found."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
