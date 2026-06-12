"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { StepHint } from "@/components/ui";

export default function WhatsAppPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 pb-8">
      <Link href="/app" className="text-[13px] font-semibold text-emerald-700">
        ← Back to Hub
      </Link>

      <StepHint
        icon="💬"
        title="WhatsApp alerts — no setup needed"
        body="All patient and parent notifications open directly in WhatsApp on your phone. No QR scan, no server connection required."
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-emerald-900">Client-side deep links</p>
            <p className="text-[12px] text-emerald-800">Tap → WhatsApp opens with message pre-filled</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4">
        <h2 className="text-[14px] font-bold text-zinc-900">Where to send alerts</h2>
        <ul className="space-y-2 text-[13px] text-zinc-700">
          <li className="flex gap-2">
            <span>🏥</span>
            <span>
              <strong>Clinic Queue</strong> — token alerts and skip notices next to each patient row
            </span>
          </li>
          <li className="flex gap-2">
            <span>📚</span>
            <span>
              <strong>Coaching batches</strong> — absent alerts, fee reminders, batch broadcast
            </span>
          </li>
          <li className="flex gap-2">
            <span>📅</span>
            <span>
              <strong>Bookings</strong> — confirmation messages from booking cards
            </span>
          </li>
        </ul>
      </div>

      <p className="text-center text-[12px] leading-relaxed text-zinc-500">
        Messages are sent from your own WhatsApp number when you tap Send. BookNow never stores your WhatsApp session.
      </p>
    </div>
  );
}
