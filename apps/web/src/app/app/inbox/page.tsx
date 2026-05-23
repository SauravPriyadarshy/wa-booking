"use client";

import { useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";

type Conversation = {
  id: string;
  phone: string | null;
  name: string | null;
  status: string;
  labels: string[];
  lastMessageAt: string | null;
};

type Message = {
  id: string;
  direction: "IN" | "OUT";
  body: string;
  status: string;
  receivedAt: string;
};

export default function InboxPage() {
  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function api(path: string) {
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}${path}`, { headers: { authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any)?.message ?? "Request failed");
    return data;
  }

  async function loadConvos() {
    setErr(null);
    const data = (await api("/conversations")) as Conversation[];
    setConvos(data);
    if (!activeId && data[0]?.id) setActiveId(data[0].id);
  }

  async function loadMessages(id: string) {
    setErr(null);
    const data = (await api(`/conversations/${encodeURIComponent(id)}/messages`)) as { items: Message[] };
    // API returns desc; render ascending for chat feel
    setMessages([...data.items].reverse());
  }

  useEffect(() => {
    loadConvos().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-md px-4 py-6">
        <div className="flex items-center justify-between">
          <a href="/app" className="text-sm text-emerald-700">
            Back
          </a>
          <div className="text-sm text-zinc-500">Inbox</div>
        </div>

        {err ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : null}

        <div className="mt-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Conversations</div>
            <button
              type="button"
              onClick={() => loadConvos().catch((e) => setErr(e.message))}
              className="rounded-2xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-800"
            >
              Refresh
            </button>
          </div>

          {convos.length === 0 ? (
            <div className="mt-2 text-xs text-zinc-500">No conversations yet. Connect WhatsApp worker first.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              {convos.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-2xl border p-3 text-left ${
                    activeId === c.id ? "border-emerald-200 bg-emerald-50" : "border-zinc-100 bg-zinc-50"
                  }`}
                >
                  <div className="text-sm font-semibold">{c.name ?? c.phone ?? "Conversation"}</div>
                  <div className="mt-0.5 text-xs text-zinc-600">{c.phone ?? "—"}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {activeId ? (
          <div className="mt-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="text-sm font-semibold">Messages</div>
            {messages.length === 0 ? (
              <div className="mt-2 text-xs text-zinc-500">No messages yet.</div>
            ) : (
              <div className="mt-3 grid gap-2">
                {messages.slice(-20).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.direction === "OUT"
                        ? "ml-auto bg-emerald-600 text-white"
                        : "mr-auto bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.body}</div>
                    <div className="mt-1 text-[10px] opacity-80">
                      {new Date(m.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

