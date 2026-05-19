/** Dominios que Resend no permite como remitente (deben usarse solo en replyTo). */
const DISALLOWED_FROM_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
]);

export function extractEmailAddress(from: string): string | null {
  const angle = from.match(/<([^>]+)>/);
  if (angle?.[1]) {
    return angle[1].trim().toLowerCase();
  }
  const trimmed = from.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : null;
}

export function isDisallowedMailFrom(from: string): boolean {
  const email = extractEmailAddress(from);
  if (!email) {
    return false;
  }
  const domain = email.split('@')[1];
  return domain ? DISALLOWED_FROM_DOMAINS.has(domain) : false;
}

export function isResendDomainVerificationError(message: string): boolean {
  return /domain is not verified/i.test(message);
}

/** onboarding@resend.dev solo permite enviar al email de la cuenta Resend. */
export function isResendSandboxRecipientError(message: string): boolean {
  return /only send testing emails to your own email address/i.test(message);
}

export function isResendTestFromAddress(from: string): boolean {
  const email = extractEmailAddress(from);
  return email === 'onboarding@resend.dev';
}
