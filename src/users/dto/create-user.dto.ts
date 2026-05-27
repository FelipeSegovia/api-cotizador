import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import type { UserRole } from '../../entities/user.entity';

function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pablo Silva' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ format: 'email', example: 'juan@quoteflow.cl' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+56 9 1234 5678' })
  @IsOptional()
  @IsString()
  @Length(0, 32)
  mobilePhone?: string;

  @ApiProperty({ enum: ['admin', 'common'], example: 'common' })
  @IsEnum(['admin', 'common'] as const)
  role!: UserRole;

  @ApiProperty({ minLength: 8, example: 'TempPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
