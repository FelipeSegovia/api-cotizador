import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'node:path';
import { buildResendSmtpTransport } from './mail-transport.config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: buildResendSmtpTransport(),
      defaults: {
        from: `"${process.env.MAIL_FROM_NAME ?? 'Cotizador'}" <${process.env.MAIL_FROM ?? 'onboarding@resend.dev'}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
