import type SMTPTransport from 'nodemailer/lib/smtp-transport';

/** Transport SMTP hacia Resend (smtp.resend.com). */
export function buildResendSmtpTransport(): SMTPTransport.Options {
  const port = parseInt(process.env.MAIL_SMTP_PORT?.trim() || '587', 10);
  const secure = port === 465;

  return {
    host: 'smtp.resend.com',
    port,
    secure,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY?.trim() ?? '',
    },
  };
}
