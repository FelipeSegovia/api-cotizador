import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Resend } from 'resend';
import {
  buildUserCredentialsMailContext,
  type SendUserCredentialsMailParams,
} from './mail-credentials.util';
import {
  isDisallowedMailFrom,
  isResendDomainVerificationError,
  isResendSandboxRecipientError,
} from './mail-from.util';
import type { QuotationMailContext } from './mail.types';
import { renderQuotationSentHtml } from './quotation-mail.template';
import { renderUserCredentialsHtml } from './user-credentials-mail.template';
import { RESEND_CLIENT } from './resend.provider';

export interface SendQuotationMailParams {
  to: string;
  fromName: string;
  replyTo: string;
  context: QuotationMailContext;
  pdf: { filename: string; content: Buffer };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@Inject(RESEND_CLIENT) private readonly resend: Resend) {}

  async sendQuotationMail(
    params: SendQuotationMailParams,
  ): Promise<{ messageId: string }> {
    const { to, fromName, replyTo, context, pdf } = params;
    const mailFrom = process.env.MAIL_FROM?.trim();
    const subject = `Cotización ${context.quoteNumber} — ${context.companyName}`;
    const projectTitle = context.projectTitle?.trim() || 'Sin título';
    const logKey = { quotationId: context.quotationId, to };

    if (process.env.MAIL_ENABLED !== 'true') {
      const messageId = `dev-noop-${randomUUID()}`;
      this.logger.log({
        msg: 'Correo omitido (MAIL_ENABLED no es true)',
        ...logKey,
        messageId,
      });
      return { messageId };
    }

    this.assertMailConfigured(mailFrom, logKey);

    const from = `"${fromName}" <${mailFrom}>`;
    const html = renderQuotationSentHtml({ ...context, projectTitle });

    this.logger.log({
      msg: 'Enviando correo vía Resend API',
      provider: 'resend-api',
      operation: 'sendQuotationMail',
      from,
      ...logKey,
    });

    return this.dispatch(
      () =>
        this.resend.emails.send({
          from,
          to,
          replyTo,
          subject,
          html,
          attachments: [
            {
              filename: pdf.filename,
              content: pdf.content,
              contentType: 'application/pdf',
            },
          ],
          tags: [{ name: 'category', value: 'quotation' }],
        }),
      logKey,
    );
  }

  async sendUserCredentialsMail(
    params: SendUserCredentialsMailParams,
  ): Promise<{ messageId: string }> {
    const { to, isResend } = params;
    const mailFrom = process.env.MAIL_FROM?.trim();
    const fromName = process.env.MAIL_FROM_NAME?.trim() || 'Cotizador';
    const loginUrl =
      process.env.APP_LOGIN_URL?.trim() || 'http://localhost:5173/login';
    const subject = isResend
      ? 'Tu nueva contraseña provisional — QuoteFlow'
      : 'Bienvenido al cotizador — credenciales de acceso';
    const logKey = { to, isResend };

    if (process.env.MAIL_ENABLED !== 'true') {
      const messageId = `dev-noop-${randomUUID()}`;
      this.logger.log({
        msg: 'Correo de credenciales omitido (MAIL_ENABLED no es true)',
        ...logKey,
        messageId,
      });
      return { messageId };
    }

    this.assertMailConfigured(mailFrom, logKey);

    const from = `"${fromName}" <${mailFrom}>`;
    const html = renderUserCredentialsHtml(
      buildUserCredentialsMailContext(params, loginUrl),
    );

    this.logger.log({
      msg: 'Enviando correo vía Resend API',
      provider: 'resend-api',
      operation: 'sendUserCredentialsMail',
      from,
      ...logKey,
    });

    return this.dispatch(
      () =>
        this.resend.emails.send({
          from,
          to,
          subject,
          html,
          tags: [
            { name: 'category', value: 'user-credentials' },
            { name: 'is_resend', value: isResend ? 'true' : 'false' },
          ],
        }),
      logKey,
    );
  }

  private async dispatch(
    send: () => Promise<{
      data: { id: string } | null;
      error: { message: string; name?: string } | null;
    }>,
    logKey: Record<string, unknown>,
  ): Promise<{ messageId: string }> {
    try {
      const { data, error } = await send();
      if (error) {
        throw new Error(error.message);
      }
      const messageId = data?.id ?? randomUUID();
      this.logger.log({ msg: 'Correo enviado', messageId, ...logKey });
      return { messageId };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      this.logger.error({
        msg: 'Fallo al enviar correo vía Resend',
        err: { message: errorMessage },
        ...logKey,
      });
      if (isResendDomainVerificationError(errorMessage)) {
        throw new UnprocessableEntityException(
          'El remitente (MAIL_FROM) debe usar un dominio verificado en Resend. ' +
            'Configura MAIL_FROM con onboarding@resend.dev (pruebas) o una dirección de tu dominio en https://resend.com/domains',
        );
      }
      if (isResendSandboxRecipientError(errorMessage)) {
        throw new UnprocessableEntityException(
          'Con MAIL_FROM=onboarding@resend.dev solo puedes enviar al correo de tu cuenta Resend. ' +
            'Para enviar a clientes (p. ej. test@gmail.com), verifica tu dominio en https://resend.com/domains y usa MAIL_FROM en ese dominio.',
        );
      }
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }
  }

  private assertMailConfigured(
    mailFrom: string | undefined,
    logContext: Record<string, unknown>,
  ): asserts mailFrom is string {
    if (!mailFrom) {
      this.logger.error({ msg: 'MAIL_FROM no configurado', ...logContext });
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }
    if (!process.env.RESEND_API_KEY?.trim()) {
      this.logger.error({
        msg: 'RESEND_API_KEY no configurado',
        ...logContext,
      });
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }
    if (isDisallowedMailFrom(mailFrom)) {
      this.logger.error({
        msg: 'MAIL_FROM usa un dominio no permitido como remitente en Resend',
        mailFromDomain: mailFrom.split('@')[1],
        ...logContext,
      });
      throw new UnprocessableEntityException(
        'MAIL_FROM debe ser una dirección de un dominio verificado en Resend (ej. onboarding@resend.dev o cotizaciones@tudominio.com). ' +
          'No uses Gmail/Outlook como remitente; el correo del usuario va en replyTo.',
      );
    }
  }
}
