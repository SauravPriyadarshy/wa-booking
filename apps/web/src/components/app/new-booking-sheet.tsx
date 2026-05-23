"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { BottomSheet, Button, toast } from "@/components/ui";

type Customer = { id: string; name: string | null; phone: string | null };
type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
};
type Staff = { id: string; user: { name: string | null }; title: string | null; isAvailable: boolean };
type Slot = { startAt: string; endAt: string; staffId: string | null };

async function api(path: string, init?: RequestInit) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login");
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Request failed");
  return data;
}

function formatServiceLine(s: Service) {
  const price =
    s.priceCents != null ? `₹${Math.round(s.priceCents / 100).toLocaleString("en-IN")}` : "—";
  return `${s.name} · ${price} · ${s.durationMin} min`;
}

function formatSlot(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

type Props = {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  /** When opening from reschedule, pre-select this customer (step 1). */
  defaultCustomerId?: string;
  onCreated: () => void;
};

export function NewBookingSheet({ open, onClose, defaultDate, defaultCustomerId, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("AUTO");
  const [date, setDate] = useState(defaultDate);
  const [slotStartAt, setSlotStartAt] = useState("");
  const [sendWa, setSendWa] = useState(true);

  const activeServices = useMemo(() => services.filter((s) => s.isActive), [services]);

  useEffect(() => {
    if (open) {
      setDate(defaultDate);
      setStep(1);
      setErr(null);
      setSlotStartAt("");
      setSlots([]);
      setCustomerId(defaultCustomerId ?? "");
    }
  }, [open, defaultDate, defaultCustomerId]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [cust, svc, st] = await Promise.all([api("/customers"), api("/services"), api("/staff")]);
      setCustomers(cust as Customer[]);
      setServices(svc as Service[]);
      setStaff(st as Staff[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadCatalog();
  }, [open, loadCatalog]);

  useEffect(() => {
    if (staff.length === 1 && staff[0]?.isAvailable) {
      setStaffId(staff[0].id);
    }
  }, [staff]);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    setErr(null);
    try {
      const q =
        staffId && staffId !== "AUTO"
          ? `&staffId=${encodeURIComponent(staffId)}`
          : "";
      const data = await api(
        `/appointments/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}${q}`,
      );
      setSlots(data as Slot[]);
    } catch (e) {
      setSlots([]);
      setErr(e instanceof Error ? e.message : "No slots");
    }
  }, [serviceId, date, staffId]);

  useEffect(() => {
    if (open && step >= 2 && serviceId) void loadSlots();
  }, [open, step, serviceId, date, staffId, loadSlots]);

  async function quickAddCustomer() {
    const name = quickName.trim();
    const phone = quickPhone.trim();
    if (name.length < 2 && phone.length < 6) {
      setErr("Enter a name (2+ letters) or a valid phone");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const created = (await api("/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.length >= 2 ? name : undefined,
          phone: phone || undefined,
        }),
      })) as Customer;
      await loadCatalog();
      setCustomerId(created.id);
      setQuickName("");
      setQuickPhone("");
      toast.success("Customer added");
      setStep(2);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add customer");
    } finally {
      setSaving(false);
    }
  }

  async function submitBooking() {
    if (!customerId || !serviceId || !slotStartAt) {
      setErr("Pick customer, service, and time");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await api("/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerId,
          serviceId,
          staffId: staffId && staffId !== "AUTO" ? staffId : undefined,
          startAt: slotStartAt,
        }),
      });
      if (sendWa) {
        /* WhatsApp confirmation send — wire when worker endpoint exists */
      }
      toast.success("Booking created");
      onCreated();
      onClose();
      setStep(1);
      setCustomerId("");
      setServiceId("");
      setSlotStartAt("");
      setSlots([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create");
    } finally {
      setSaving(false);
    }
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <BottomSheet open={open} onClose={onClose} title="New booking">
      <div className="flex gap-3 border-b border-zinc-100 pb-3 text-[11px] font-semibold">
        <span className={step >= 1 ? "text-emerald-600" : "text-zinc-400"}>① Who</span>
        <span className="text-zinc-300">→</span>
        <span className={step >= 2 ? "text-emerald-600" : "text-zinc-400"}>② What &amp; when</span>
        <span className="text-zinc-300">→</span>
        <span className={step >= 3 ? "text-emerald-600" : "text-zinc-400"}>③ Confirm</span>
      </div>

      {err ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="py-8 text-center text-[13px] text-zinc-500">Loading…</div>
      ) : step === 1 ? (
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700">Existing customer</label>
            <select
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Search list — tap to choose</option>
              {customers.slice(0, 40).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? "Customer"} {c.phone ? `· ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3">
            <div className="text-[12px] font-semibold text-zinc-800">Quick add</div>
            <p className="mt-0.5 text-[11px] text-zinc-500">Name + phone — only two fields.</p>
            <input
              placeholder="Name"
              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
            />
            <input
              placeholder="Phone"
              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
              value={quickPhone}
              onChange={(e) => setQuickPhone(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mt-3 w-full"
              loading={saving}
              onClick={() => void quickAddCustomer()}
            >
              Add &amp; continue
            </Button>
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!customerId}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      ) : step === 2 ? (
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700">Service</label>
            <select
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setSlotStartAt("");
              }}
            >
              <option value="">Choose service</option>
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatServiceLine(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700">Staff</label>
            <select
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setSlotStartAt("");
              }}
            >
              <option value="AUTO">Auto-assign</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.name ?? "Staff"}
                  {s.title ? ` · ${s.title}` : ""}
                  {!s.isAvailable ? " (off)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700">Date</label>
            <input
              type="date"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlotStartAt("");
              }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700">Time</label>
            {slots.length === 0 ? (
              <p className="text-[12px] text-zinc-500">Pick a service and date to see free slots.</p>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {slots.slice(0, 36).map((s) => (
                  <button
                    key={s.startAt}
                    type="button"
                    onClick={() => setSlotStartAt(s.startAt)}
                    className={`min-h-9 rounded-full px-3 py-1.5 text-[12px] font-semibold transition tap-highlight-none ${
                      slotStartAt === s.startAt
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                    }`}
                  >
                    {formatSlot(s.startAt)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="flex-1"
              disabled={!serviceId || !slotStartAt}
              onClick={() => setStep(3)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-[14px]">
            <div className="font-semibold text-zinc-900">{selectedCustomer?.name ?? "Customer"}</div>
            <div className="text-[12px] text-zinc-600">{selectedCustomer?.phone ?? "—"}</div>
            <div className="mt-3 border-t border-zinc-200 pt-3 text-[13px] text-zinc-800">
              <div>{selectedService ? formatServiceLine(selectedService) : "—"}</div>
              <div className="mt-1 text-zinc-600">
                {slotStartAt
                  ? `${new Date(slotStartAt).toLocaleString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "—"}
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={sendWa}
              onChange={(e) => setSendWa(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
            />
            <span className="text-[13px] text-zinc-700">Send WhatsApp confirmation (coming soon)</span>
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="flex-1"
              loading={saving}
              onClick={() => void submitBooking()}
            >
              Confirm booking
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
