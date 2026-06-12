export type WhatsAppMessageType =
  | 'CLINIC_TOKEN'
  | 'CLINIC_SKIP'
  | 'COACHING_ABSENT'
  | 'COACHING_FEE_REMINDER'
  | 'BATCH_BROADCAST';

export interface WhatsAppPayload {
  phone: string;
  type: WhatsAppMessageType;
  variables: Record<string, string>;
}

function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.startsWith('91') && digits.length >= 12) return digits.slice(0, 12);
  return digits;
}

function buildMessage(type: WhatsAppMessageType, variables: Record<string, string>): string {
  switch (type) {
    case 'CLINIC_TOKEN':
      return `Dr. ${variables.doctorName ?? 'Clinic'} ki clinic se suchna:\nAapka Token Number #${variables.token} hai.\nAbhi token #${variables.currentToken} ka consultation chal raha hai. Kripya samay par waiting room mein upasthit rahein.`;
    case 'CLINIC_SKIP':
      return `Namaskar, aapka token #${variables.token} par call kiya gaya tha par aap anupasthit the. Aapko standby queue mein daal diya gaya hai. Kripya counter par assistant se milein.`;
    case 'COACHING_ABSENT':
      return `Priya Abhibhavak,\nAapka bacha ${variables.studentName} aaj ${variables.batchName} ki kaksha se ABSENT hai.\n- ${variables.instituteName ?? 'BookNow Coaching'}`;
    case 'COACHING_FEE_REMINDER':
      return `Namaskar,\n${variables.studentName} ki ${variables.month} mahine ki fees (₹${variables.amount}) pending hai. Kripya ise counter par cash ya UPI ke madhyam se jald jama karein.\n- ${variables.instituteName ?? 'BookNow Coaching'}`;
    case 'BATCH_BROADCAST':
      return variables.message ?? '';
    default:
      return '';
  }
}

export function buildWhatsAppLink({ phone, type, variables }: WhatsAppPayload): string {
  const formattedPhone = cleanPhone(phone);
  const text = buildMessage(type, variables);
  if (!formattedPhone) return 'https://wa.me/';
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppLink(payload: WhatsAppPayload): void {
  window.open(buildWhatsAppLink(payload), '_blank');
}
