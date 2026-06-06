import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ format: 'email', example: 'usuario@ejemplo.cl' })
  @IsEmail()
  email!: string;
}
