export interface SendUserCredentialsMailParams {
  to: string;
  name: string;
  email: string;
  temporaryPassword: string;
  isResend: boolean;
}

export interface UserCredentialsMailContext {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  isResend: boolean;
}

export function buildUserCredentialsMailContext(
  params: SendUserCredentialsMailParams,
  loginUrl: string,
): UserCredentialsMailContext {
  return {
    name: params.name,
    email: params.email,
    temporaryPassword: params.temporaryPassword,
    loginUrl,
    isResend: params.isResend,
  };
}
