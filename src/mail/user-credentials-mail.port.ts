import type { SendUserCredentialsMailParams } from './mail-credentials.util';

export type { SendUserCredentialsMailParams } from './mail-credentials.util';

export interface UserCredentialsMailPort {
  sendUserCredentialsMail(
    params: SendUserCredentialsMailParams,
  ): Promise<{ messageId: string }>;
}

export const USER_CREDENTIALS_MAIL_PORT = Symbol('USER_CREDENTIALS_MAIL_PORT');
