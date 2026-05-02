import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class LoginDto {
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1, { message: 'password debe ser una cadena no vacía' })
  password!: string;
}
