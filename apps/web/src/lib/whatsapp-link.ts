/** Normalize phone for wa.me (India-first). */
export function normalizeWaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.startsWith("91") && digits.length >= 12) return digits.slice(0, 12);
  return digits;
}

export function buildWaMeUrl(phone: string, text: string): string {
  const to = normalizeWaPhone(phone);
  if (!to) return "https://wa.me/";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export function buildBookingConfirmText(businessName: string, serviceName: string): string {
  return `Maine ${businessName} mein ${serviceName} book ki hai!`;
}

export function buildFeeReminderText(month: string): string {
  return `Fee reminder for ${month}`;
}

export function openWaMeLink(phone: string, text: string): void {
  window.location.assign(buildWaMeUrl(phone, text));
}
