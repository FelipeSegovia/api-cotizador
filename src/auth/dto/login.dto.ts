import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'admin@ejemplo.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @ApiProperty({
    format: 'password',
    description: 'Contraseña del usuario',
    example: '********',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'password debe ser una cadena no vacía' })
  password!: string;
}
