import { Logger, type Provider } from '@nestjs/common';
import { Resend } from 'resend';

export const RESEND_CLIENT = Symbol('RESEND_CLIENT');

/**
 * Crea el cliente Resend a partir de RESEND_API_KEY.
 * Si la variable no está configurada se construye igualmente (el SDK aceptará
 * la clave en runtime) para que la app pueda arrancar en entornos donde el
 * envío de correos esté deshabilitado (MAIL_ENABLED!=true).
 */
export const resendClientProvider: Provider = {
  provide: RESEND_CLIENT,
  useFactory: (): Resend => {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      new Logger('ResendClient').warn({
        msg: 'RESEND_API_KEY no configurado; el cliente Resend se inicializa vacío',
      });
    }
    return new Resend(apiKey);
  },
};
