import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import type { ClientStatus } from '../../entities/client.entity';

export const CLIENT_STATUSES: ClientStatus[] = [
  'not_contacted',
  'approved',
  'rejected',
];

function emptyToNull(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export class UpdateClientContactsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  phone?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  whatsapp?: boolean;
}

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Ana Torres' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ example: 'https://anatorres.com', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @Length(1, 500)
  website?: string | null;

  @ApiPropertyOptional({ example: 'ana@anatorres.com', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: '+34 600 123 456', nullable: true })
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @Length(1, 64)
  phone?: string | null;

  @ApiPropertyOptional({ enum: CLIENT_STATUSES })
  @IsOptional()
  @IsEnum(CLIENT_STATUSES)
  status?: ClientStatus;

  @ApiPropertyOptional({ type: UpdateClientContactsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateClientContactsDto)
  contacts?: UpdateClientContactsDto;
}
