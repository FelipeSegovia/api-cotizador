import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import type { InvitationRole } from '../../entities/invitation.entity';

function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateInvitationDto {
  @ApiProperty({ format: 'email', example: 'nuevo@empresa.cl' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Obligatorio para admin. Business lo ignora (usa su empresa).',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    enum: ['business', 'common'],
    description:
      'Obligatorio para admin. Business siempre invita common (se ignora).',
  })
  @IsOptional()
  @IsEnum(['business', 'common'] as const)
  role?: InvitationRole;
}
