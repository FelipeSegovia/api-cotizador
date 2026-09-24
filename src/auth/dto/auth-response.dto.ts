import { ApiProperty } from '@nestjs/swagger';

export class AuthUserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+56912345678',
  })
  mobilePhone!: string;

  @ApiProperty({ enum: ['admin', 'business', 'common'] })
  role!: 'admin' | 'business' | 'common';

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  mustChangePassword!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class LoginSuccessDto {
  @ApiProperty({ type: AuthUserSummaryDto })
  user!: AuthUserSummaryDto;

  @ApiProperty({ description: 'JWT de acceso' })
  token!: string;

  @ApiProperty({
    description: 'Segundos hasta la expiración del token',
    example: 900,
  })
  expiresIn!: number;
}

export class LogoutSuccessDto {
  @ApiProperty({ example: 'Logout exitoso' })
  message!: string;
}

export class AcceptInvitationSuccessDto {
  @ApiProperty({ example: 'Cuenta creada. Ya puedes iniciar sesión.' })
  message!: string;
}

export class ForgotPasswordSuccessDto {
  @ApiProperty({
    example:
      'Si el correo existe en nuestro sistema, recibirás un código de verificación en breve.',
  })
  message!: string;
}

export class VerifyResetCodeSuccessDto {
  @ApiProperty({ example: true })
  valid!: true;
}

export class ResetPasswordSuccessDto {
  @ApiProperty({ example: 'Contraseña actualizada correctamente' })
  message!: string;
}
