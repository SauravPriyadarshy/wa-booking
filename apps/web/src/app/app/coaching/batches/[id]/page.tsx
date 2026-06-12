"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { ManualWhatsAppButton } from "@/components/app/manual-whatsapp-button";
import { openWhatsAppLink } from "@/lib/whatsapp-router";
import { Button, Card } from "@/components/ui";

type FeeRow = {
  id: string;
  amountCents: number;
  paidAmountCents: number;
  isFullyPaid: boolean;
  paymentMode: "CASH" | "UPI" | null;
};

type RosterRow = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  classGrade: string | null;
  admissionDate: string;
  presentToday: boolean | null;
  fee: FeeRow | null;
};

type TestRow = {
  id: string;
  subject: string;
  testDate: string;
  maxMarks: number;
  _count: { results: number };
};

type OpsPayload = {
  batch: {
    id: string;
    name: string;
    feesAmountCents: number | null;
    startTime: string;
    endTime: string;
    course: { name: string; stream: { name: string } };
  };
  month: string;
  dateISO: string;
  roster: RosterRow[];
  tests: TestRow[];
};

type Tab = "roster" | "attendance" | "fees" | "tests";

function formatINR(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

export default function BatchOpsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: batchId } = use(params);
  const [ops, setOps] = useState<OpsPayload | null>(null);
  const [tab, setTab] = useState<Tab>("roster");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addParentPhone, setAddParentPhone] = useState("");
  const [adding, setAdding] = useState(false);

  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [savingAtt, setSavingAtt] = useState(false);

  const [feeEdit, setFeeEdit] = useState<string | null>(null);
  const [feePaidRupees, setFeePaidRupees] = useState("");
  const [feeMode, setFeeMode] = useState<"CASH" | "UPI">("CASH");
  const [feeFull, setFeeFull] = useState(true);
  const [savingFee, setSavingFee] = useState(false);

  const [testOpen, setTestOpen] = useState(false);
  const [testSubject, setTestSubject] = useState("");
  const [testDate, setTestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [testMax, setTestMax] = useState("100");
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingTest, setSavingTest] = useState(false);

  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState<"attendance" | "fees" | "custom">("custom");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastIndex, setBroadcastIndex] = useState(0);
  const [broadcastSent, setBroadcastSent] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase()}/coaching/batches/${batchId}/ops`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as OpsPayload & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed to load batch");
      setOps(data);
      setPresent(Object.fromEntries(data.roster.map((s) => [s.id, s.presentToday ?? true])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function quickAdd() {
    const token = localStorage.getItem("token");
    if (!token || !addName.trim()) return;
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase()}/coaching/students/direct-add`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batchId,
          name: addName.trim(),
          phone: addPhone.trim() || undefined,
          parentPhone: addParentPhone.trim() || addPhone.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not add student");
      setAddName("");
      setAddPhone("");
      setAddParentPhone("");
      setMsg("Student added to roster.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  async function saveAttendance() {
    if (!ops) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingAtt(true);
    try {
      const records = ops.roster.map((s) => ({ studentId: s.id, present: present[s.id] ?? true }));
      const res = await fetch(`${apiBase()}/coaching/attendance/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchId, dateISO: ops.dateISO, records }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Save failed");
      setMsg(`Attendance saved for ${ops.dateISO}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingAtt(false);
    }
  }

  async function saveFeeLedger(feeId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingFee(true);
    try {
      const rupees = Number(feePaidRupees);
      const body = feeFull
        ? { isFullyPaid: true, paymentMode: feeMode }
        : {
            isFullyPaid: false,
            amountPaid: Math.round(rupees * 100),
            paymentMode: feeMode,
          };
      const res = await fetch(`${apiBase()}/coaching/fees/${feeId}/ledger`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Update failed");
      setFeeEdit(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingFee(false);
    }
  }

  async function createTest() {
    const token = localStorage.getItem("token");
    if (!token || !testSubject.trim()) return;
    setSavingTest(true);
    try {
      const res = await fetch(`${apiBase()}/coaching/tests`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batchId,
          subject: testSubject.trim(),
          testDate,
          maxMarks: Number(testMax) || 100,
        }),
      });
      const data = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setTestOpen(false);
      setTestSubject("");
      if (data.id) setActiveTestId(data.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingTest(false);
    }
  }

  async function saveScores() {
    if (!activeTestId || !ops) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingTest(true);
    try {
      const payload = ops.roster.map((s) => ({
        studentId: s.id,
        marksObtained: Number(scores[s.id] ?? 0),
      }));
      const res = await fetch(`${apiBase()}/coaching/tests/score-batch`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ testId: activeTestId, scores: payload }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setMsg("Test scores saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingTest(false);
    }
  }

  const activeTest = useMemo(
    () => ops?.tests.find((t) => t.id === activeTestId) ?? ops?.tests[0] ?? null,
    [ops?.tests, activeTestId],
  );

  const broadcastTargets = useMemo(
    () => (ops?.roster ?? []).filter((s) => s.parentPhone),
    [ops?.roster],
  );
  const broadcastCurrent = broadcastTargets[broadcastIndex] ?? null;

  function openBroadcastAlert() {
    if (!broadcastCurrent || !ops) return;
    const instituteName = ops.batch.course.stream.name;
    if (broadcastCategory === "fees" && broadcastCurrent.fee && !broadcastCurrent.fee.isFullyPaid) {
      openWhatsAppLink({
        phone: broadcastCurrent.parentPhone!,
        type: "COACHING_FEE_REMINDER",
        variables: {
          studentName: broadcastCurrent.name,
          month: ops.month,
          amount: String(Math.round((broadcastCurrent.fee.amountCents - broadcastCurrent.fee.paidAmountCents) / 100)),
          instituteName,
        },
      });
    } else if (broadcastCategory === "attendance") {
      const status = broadcastCurrent.presentToday === false ? "ABSENT" : "PRESENT";
      openWhatsAppLink({
        phone: broadcastCurrent.parentPhone!,
        type: "BATCH_BROADCAST",
        variables: {
          message: `Priya Abhibhavak,\nAaj ${ops.dateISO} ko ${broadcastCurrent.name} batch ${ops.batch.name} mein ${status} mark kiya gaya.\n- ${instituteName}`,
        },
      });
    } else {
      openWhatsAppLink({
        phone: broadcastCurrent.parentPhone!,
        type: "BATCH_BROADCAST",
        variables: { message: `${broadcastMessage.trim()}\n\n— ${ops.batch.name}` },
      });
    }
    setBroadcastSent((prev) => new Set(prev).add(broadcastCurrent.id));
  }

  if (loading) return <div className="py-10 text-center text-[14px] text-zinc-500">Loading batch…</div>;
  if (!ops) return <div className="py-10 text-center text-[14px] text-red-600">{error ?? "Batch not found"}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/app/coaching/matrix" className="text-[13px] font-semibold text-emerald-700">
          ← Matrix
        </Link>
        <div className="flex gap-2">
          <Link href={`/app/coaching/batches/${batchId}/broadcast`}>
            <Button type="button" size="sm" variant="secondary">
              Broadcast
            </Button>
          </Link>
          <Link href={`/app/coaching/reports?batch=${batchId}`}>
            <Button type="button" size="sm" variant="secondary">
              Report
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-[20px] font-bold text-zinc-900">{ops.batch.name}</h1>
        <p className="text-[12px] text-zinc-500">
          {ops.batch.course.stream.name} · {ops.batch.course.name} · {ops.batch.startTime}–{ops.batch.endTime}
        </p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
      {msg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{msg}</div> : null}

      <div className="flex rounded-xl bg-zinc-100 p-1">
        {(
          [
            ["roster", "Roster"],
            ["attendance", "Attendance"],
            ["fees", "Fees"],
            ["tests", "Tests"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded-lg py-2 text-[12px] font-semibold ${tab === k ? "bg-white text-blue-800 shadow-sm" : "text-zinc-600"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "roster" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setBroadcastOpen(true);
                setBroadcastIndex(0);
                setBroadcastSent(new Set());
              }}
            >
              Broadcast Alert to Batch
            </Button>
          </div>
          <Card className="!p-4">
            <div className="text-[13px] font-bold text-zinc-900">Quick Add Student</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Student name"
                className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
              />
              <input
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="Student phone (optional)"
                className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
              />
              <input
                value={addParentPhone}
                onChange={(e) => setAddParentPhone(e.target.value)}
                placeholder="Parent WhatsApp"
                className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
              />
            </div>
            <Button type="button" className="mt-3" size="sm" variant="primary" loading={adding} onClick={() => void quickAdd()}>
              Add to roster
            </Button>
          </Card>

          <div className="space-y-2">
            {ops.roster.map((s) => (
              <Card key={s.id} className="!p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <Link href={`/app/students/${s.id}`} className="text-[14px] font-bold text-zinc-900 hover:text-emerald-700">
                      {s.name}
                    </Link>
                    <div className="text-[11px] text-zinc-500">
                      {s.parentPhone ?? "No parent phone"}
                      {s.classGrade ? ` · Class ${s.classGrade}` : ""}
                    </div>
                  </div>
                  <Link href={`/app/coaching/students/${s.id}/report`} className="text-[11px] font-semibold text-emerald-700">
                    Report →
                  </Link>
                </div>
              </Card>
            ))}
            {ops.roster.length === 0 ? <p className="text-center text-[13px] text-zinc-500">No students in this batch yet.</p> : null}
          </div>
        </div>
      ) : null}

      {tab === "attendance" ? (
        <div className="space-y-3">
          <p className="text-[12px] text-zinc-500">Roll call for {ops.dateISO}</p>
          {ops.roster.map((s) => {
            const isPresent = present[s.id] ?? true;
            return (
              <Card key={s.id} className="!p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[14px] font-semibold text-zinc-900">{s.name}</div>
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-zinc-600">
                    Present
                    <input
                      type="checkbox"
                      checked={isPresent}
                      onChange={(e) => setPresent((p) => ({ ...p, [s.id]: e.target.checked }))}
                      className="h-5 w-5 rounded border-zinc-300 text-emerald-600"
                    />
                  </label>
                </div>
                {!isPresent && s.parentPhone ? (
                  <div className="mt-2 border-t border-zinc-100 pt-2">
                    <ManualWhatsAppButton
                      label="Notify absent"
                      onClick={() =>
                        openWhatsAppLink({
                          phone: s.parentPhone!,
                          type: "COACHING_ABSENT",
                          variables: {
                            studentName: s.name,
                            batchName: ops.batch.name,
                            instituteName: ops.batch.course.stream.name,
                          },
                        })
                      }
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}
          <Button type="button" className="w-full" variant="primary" loading={savingAtt} onClick={() => void saveAttendance()}>
            Save attendance
          </Button>
        </div>
      ) : null}

      {tab === "fees" ? (
        <div className="space-y-2">
          <p className="text-[12px] text-zinc-500">Fee ledger — {ops.month}</p>
          {ops.roster.map((s) => {
            const fee = s.fee;
            const paid = fee?.isFullyPaid ?? false;
            return (
              <Card key={s.id} className="!p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-zinc-900">{s.name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {fee ? `${formatINR(fee.paidAmountCents)} / ${formatINR(fee.amountCents)}` : "No fee record"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={paid}
                      readOnly
                      className="h-5 w-5 rounded border-zinc-300 text-emerald-600"
                    />
                    {!paid && fee ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFeeEdit(fee.id);
                          setFeePaidRupees(String(Math.round((fee.amountCents - fee.paidAmountCents) / 100)));
                          setFeeFull(true);
                        }}
                        className="text-[11px] font-semibold text-emerald-700"
                      >
                        Update
                      </button>
                    ) : null}
                    {!paid && s.parentPhone && fee ? (
                      <ManualWhatsAppButton
                        label="Remind"
                        onClick={() =>
                          openWhatsAppLink({
                            phone: s.parentPhone!,
                            type: "COACHING_FEE_REMINDER",
                            variables: {
                              studentName: s.name,
                              month: ops.month,
                              amount: String(Math.round((fee.amountCents - fee.paidAmountCents) / 100)),
                              instituteName: ops.batch.course.stream.name,
                            },
                          })
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === "tests" ? (
        <div className="space-y-3">
          <div className="flex justify-between gap-2">
            <select
              value={activeTest?.id ?? ""}
              onChange={(e) => setActiveTestId(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-[13px]"
            >
              <option value="">Select test</option>
              {ops.tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subject} · {new Date(t.testDate).toLocaleDateString("en-IN")} · /{t.maxMarks}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" variant="primary" onClick={() => setTestOpen(true)}>
              + Test
            </Button>
          </div>

          {activeTest ? (
            <>
              {ops.roster.map((s) => (
                <Card key={s.id} className="!p-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-[14px] font-semibold text-zinc-900">{s.name}</div>
                    <input
                      type="number"
                      min={0}
                      max={activeTest.maxMarks}
                      value={scores[s.id] ?? ""}
                      onChange={(e) => setScores((p) => ({ ...p, [s.id]: e.target.value }))}
                      placeholder={`/${activeTest.maxMarks}`}
                      className="h-10 w-20 rounded-xl border border-zinc-200 px-2 text-center text-[14px]"
                    />
                  </div>
                </Card>
              ))}
              <Button type="button" className="w-full" variant="primary" loading={savingTest} onClick={() => void saveScores()}>
                Save scores
              </Button>
            </>
          ) : (
            <p className="text-center text-[13px] text-zinc-500">Create a test to enter scores.</p>
          )}
        </div>
      ) : null}

      {feeEdit ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <Card className="w-full max-w-sm !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold">Update payment</h2>
            <label className="mt-3 flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={feeFull} onChange={(e) => setFeeFull(e.target.checked)} />
              Mark fully paid
            </label>
            {!feeFull ? (
              <input
                type="number"
                value={feePaidRupees}
                onChange={(e) => setFeePaidRupees(e.target.value)}
                placeholder="Amount ₹"
                className="mt-3 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
              />
            ) : null}
            <select
              value={feeMode}
              onChange={(e) => setFeeMode(e.target.value as "CASH" | "UPI")}
              className="mt-3 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
            </select>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setFeeEdit(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" className="flex-1" loading={savingFee} onClick={() => void saveFeeLedger(feeEdit)}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {broadcastOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold">Broadcast Alert to Batch</h2>
            <p className="mt-1 text-[12px] text-zinc-500">
              Step through parents — each opens WhatsApp in a new tab with your message pre-filled.
            </p>

            <label className="mt-4 grid gap-1 text-[12px] font-medium text-zinc-700">
              Alert type
              <select
                value={broadcastCategory}
                onChange={(e) => setBroadcastCategory(e.target.value as "attendance" | "fees" | "custom")}
                className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
              >
                <option value="attendance">Attendance Summary</option>
                <option value="fees">Fee Dues Notice</option>
                <option value="custom">Custom message</option>
              </select>
            </label>

            {broadcastCategory === "custom" ? (
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={3}
                placeholder='e.g. "Class timing changed tomorrow to 8 AM."'
                className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-[14px]"
              />
            ) : null}

            {broadcastTargets.length === 0 ? (
              <p className="mt-4 text-[13px] text-zinc-500">No parent phone numbers in this batch.</p>
            ) : (
              <>
                <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">
                  Progress: {broadcastSent.size}/{broadcastTargets.length} · Step {broadcastIndex + 1}
                </div>
                {broadcastCurrent ? (
                  <div className="mt-3 rounded-xl border border-zinc-100 p-3">
                    <div className="text-[14px] font-bold text-zinc-900">{broadcastCurrent.name}</div>
                    <div className="text-[12px] text-zinc-500">{broadcastCurrent.parentPhone}</div>
                    {broadcastSent.has(broadcastCurrent.id) ? (
                      <span className="mt-1 inline-block text-[11px] font-bold text-emerald-600">Sent ✓</span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1"
                    disabled={!broadcastCurrent || (broadcastCategory === "custom" && !broadcastMessage.trim())}
                    onClick={openBroadcastAlert}
                  >
                    Send Next Alert
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setBroadcastIndex((i) => Math.min(i + 1, broadcastTargets.length - 1))}
                  >
                    Next →
                  </Button>
                </div>
              </>
            )}

            <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => setBroadcastOpen(false)}>
              Close
            </Button>
          </Card>
        </div>
      ) : null}

      {testOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <Card className="w-full max-w-sm !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold">Create test</h2>
            <input
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              placeholder="Subject e.g. Physics Unit Test"
              className="mt-3 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            />
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="mt-3 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            />
            <input
              type="number"
              value={testMax}
              onChange={(e) => setTestMax(e.target.value)}
              placeholder="Max marks"
              className="mt-3 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            />
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setTestOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" className="flex-1" loading={savingTest} onClick={() => void createTest()}>
                Create
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
