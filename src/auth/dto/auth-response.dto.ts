import { ApiProperty } from '@nestjs/swagger';

export class AuthUserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    nullable: true,
    description: 'Teléfono de contacto',
    example: '+56912345678',
  })
  mobilePhone!: string | null;
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
