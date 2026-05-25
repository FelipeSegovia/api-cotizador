import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const RESEND_SMTP_HOST = 'smtp.resend.com';
const DEFAULT_SMTP_PORT = 587;

/** Evita colgar ~60s cuando el servidor no alcanza smtp.resend.com (p. ej. puerto 465 bloqueado). */
const SMTP_TIMEOUT_MS = 15_000;

function parseSmtpPort(raw: string | undefined): number {
  const port = Number.parseInt(raw?.trim() ?? '', 10);
  if (!Number.isFinite(port) || port <= 0) {
    return DEFAULT_SMTP_PORT;
  }
  return port;
}

export function buildResendSmtpTransport(): SMTPTransport.Options {
  const port = parseSmtpPort(process.env.MAIL_SMTP_PORT);
  const implicitTls = port === 465 || port === 2465;

  return {
    host: RESEND_SMTP_HOST,
    port,
    secure: implicitTls,
    requireTLS: !implicitTls,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  };
}
