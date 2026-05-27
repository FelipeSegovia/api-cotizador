import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { resendClientProvider } from './resend.provider';

@Module({
  providers: [resendClientProvider, MailService],
  exports: [MailService],
})
export class MailModule {}
