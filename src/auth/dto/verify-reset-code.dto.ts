import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, Length } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({ format: 'email', example: 'usuario@ejemplo.cl' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Código OTP de 6 dígitos enviado al correo',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNumberString()
  @Length(6, 6)
  code!: string;
}
