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
import { openWhatsAppLink } from "@/lib/whatsapp-router";

type MeBusiness = { name?: string; categoryKey?: string | null };

/** Client-side WhatsApp deep links — no server session required. */
export function useWhatsAppLink() {
  const [businessName, setBusinessName] = useState("My Business");
  const [instituteName, setInstituteName] = useState("BookNow Coaching");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    void fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((me: { ok?: boolean; business?: MeBusiness | null }) => {
        if (me.ok && me.business?.name) {
          setBusinessName(me.business.name);
          setInstituteName(me.business.name);
        }
      })
      .catch(() => {});
  }, []);

  const bookingConfirmUrl = useCallback(
    (customerPhone: string, serviceName: string) =>
      buildWaMeUrl(customerPhone, buildBookingConfirmText(businessName, serviceName)),
    [businessName],
  );

  const feeReminderUrl = useCallback(
    (parentPhone: string, month: string) => buildWaMeUrl(parentPhone, buildFeeReminderText(month)),
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

  const openAbsenceNotification = useCallback(
    (parentPhone: string, studentName: string, batchName: string) => {
      openWhatsAppLink({
        phone: parentPhone,
        type: "COACHING_ABSENT",
        variables: { studentName, batchName, instituteName },
      });
    },
    [instituteName],
  );

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
    connected: true,
    loading: false,
    businessName,
    bookingConfirmUrl,
    feeReminderUrl,
    openBookingConfirm,
    openFeeReminder,
    openAbsenceNotification,
    openInstallmentReminder,
    showManualFallback: true,
  };
}
