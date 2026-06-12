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

export function buildAbsenceNotificationText(studentName: string, batchName: string): string {
  return `Aadarneeya Abhibhavak, aapka bacha ${studentName} aaj ${batchName} ki kaksha se ABSENT hai. - BookNow Coaching System`;
}

export function buildInstallmentReminderText(
  amountRupees: number,
  studentName: string,
  courseName: string,
  dueDate: string,
): string {
  return `Dear Parent, this is an automated reminder that an installment of ₹${amountRupees.toLocaleString('en-IN')} for ${studentName}'s enrollment in ${courseName} is due by ${dueDate}. Please clear online or via cash register.`;
}

export function openWaMeLink(phone: string, text: string): void {
  window.location.assign(buildWaMeUrl(phone, text));
}
