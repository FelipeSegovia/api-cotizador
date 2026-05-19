import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { randomUUID } from 'node:crypto';
import {
  isDisallowedMailFrom,
  isResendDomainVerificationError,
  isResendSandboxRecipientError,
} from './mail-from.util';
import type { QuotationMailContext } from './mail.types';

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

  constructor(private readonly mailerService: MailerService) {}

  async sendQuotationMail(
    params: SendQuotationMailParams,
  ): Promise<{ messageId: string }> {
    const { to, fromName, replyTo, context, pdf } = params;
    const mailFrom = process.env.MAIL_FROM?.trim();
    const subject = `Cotización ${context.quoteNumber} — ${context.companyName}`;
    const projectTitle = context.projectTitle?.trim() || 'Sin título';

    if (process.env.MAIL_ENABLED !== 'true') {
      const messageId = `dev-noop-${randomUUID()}`;
      this.logger.log({
        msg: 'Correo omitido (MAIL_ENABLED no es true)',
        quotationId: context.quotationId,
        to,
        messageId,
      });
      return { messageId };
    }

    if (!mailFrom) {
      this.logger.error({
        msg: 'MAIL_FROM no configurado',
        quotationId: context.quotationId,
      });
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }

    if (!process.env.RESEND_API_KEY?.trim()) {
      this.logger.error({
        msg: 'RESEND_API_KEY no configurado',
        quotationId: context.quotationId,
      });
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }

    if (isDisallowedMailFrom(mailFrom)) {
      this.logger.error({
        msg: 'MAIL_FROM usa un dominio no permitido como remitente en Resend',
        quotationId: context.quotationId,
        mailFromDomain: mailFrom.split('@')[1],
      });
      throw new UnprocessableEntityException(
        'MAIL_FROM debe ser una dirección de un dominio verificado en Resend (ej. onboarding@resend.dev o cotizaciones@tudominio.com). ' +
          'No uses Gmail/Outlook como remitente; el correo del usuario va en replyTo.',
      );
    }

    try {
      const messageId = this.messageIdFromSendResult(
        await this.mailerService.sendMail({
          from: `"${fromName}" <${mailFrom}>`,
          to,
          replyTo,
          subject,
          template: 'quotation-sent',
          context: {
            ...context,
            projectTitle,
          },
          attachments: [
            {
              filename: pdf.filename,
              content: pdf.content,
              contentType: 'application/pdf',
            },
          ],
        }),
      );

      this.logger.log({
        msg: 'Correo de cotización enviado',
        quotationId: context.quotationId,
        to,
        messageId,
      });

      return { messageId };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      this.logger.error({
        msg: 'Fallo al enviar correo de cotización',
        quotationId: context.quotationId,
        to,
        err: { message: errorMessage },
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

  private messageIdFromSendResult(info: unknown): string {
    if (
      typeof info === 'object' &&
      info !== null &&
      'messageId' in info &&
      typeof info.messageId === 'string' &&
      info.messageId.length > 0
    ) {
      return info.messageId;
    }
    return randomUUID();
  }
}
