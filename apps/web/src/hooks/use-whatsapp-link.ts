"use client";

import { useCallback, useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";
import {
  buildBookingConfirmText,
  buildFeeReminderText,
  buildAbsenceNotificationText,
  buildInstallmentReminderText,
  buildWaMeUrl,
  openWaMeLink,
} from "@/lib/whatsapp-link";

type WaStatus = { status?: string };

type MeBusiness = { name?: string };

export function useWhatsAppLink() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState("My Business");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    if (!token) {
      setConnected(false);
      return;
    }

    async function load() {
      try {
        const [waRes, meRes] = await Promise.all([
          fetch(`${apiBase()}/whatsapp/status`, { headers: { authorization: `Bearer ${token}` } }),
          fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } }),
        ]);
        const wa = (await waRes.json()) as WaStatus;
        const me = (await meRes.json()) as { ok?: boolean; business?: MeBusiness | null };
        if (cancelled) return;
        setConnected((wa.status ?? "").toUpperCase() === "CONNECTED");
        if (me.ok && me.business?.name) setBusinessName(me.business.name);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const bookingConfirmUrl = useCallback(
    (customerPhone: string, serviceName: string) =>
      buildWaMeUrl(customerPhone, buildBookingConfirmText(businessName, serviceName)),
    [businessName],
  );

  const feeReminderUrl = useCallback(
    (parentPhone: string, month: string) =>
      buildWaMeUrl(parentPhone, buildFeeReminderText(month)),
    [],
  );

  const openBookingConfirm = useCallback(
    (customerPhone: string, serviceName: string) => {
      openWaMeLink(customerPhone, buildBookingConfirmText(businessName, serviceName));
    },
    [businessName],
  );

  const openFeeReminder = useCallback((parentPhone: string, month: string) => {
    openWaMeLink(parentPhone, buildFeeReminderText(month));
  }, []);

  const openAbsenceNotification = useCallback((parentPhone: string, studentName: string, batchName: string) => {
    openWaMeLink(parentPhone, buildAbsenceNotificationText(studentName, batchName));
  }, []);

  const openInstallmentReminder = useCallback(
    (parentPhone: string, amountRupees: number, studentName: string, courseName: string, dueDate: string) => {
      openWaMeLink(
        parentPhone,
        buildInstallmentReminderText(amountRupees, studentName, courseName, dueDate),
      );
    },
    [],
  );

  return {
    connected,
    loading: connected === null,
    businessName,
    bookingConfirmUrl,
    feeReminderUrl,
    openBookingConfirm,
    openFeeReminder,
    openAbsenceNotification,
    openInstallmentReminder,
    /** Show manual WA action when server automations are unavailable. */
    showManualFallback: connected === false,
  };
}
