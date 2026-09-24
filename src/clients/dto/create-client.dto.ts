import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export class CreateClientDto {
  @ApiProperty({ example: 'Ana Torres' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({ example: 'https://anatorres.com' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @Length(1, 500)
  website?: string;

  @ApiPropertyOptional({ example: 'ana@anatorres.com' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+34 600 123 456' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @Length(1, 64)
  phone?: string;
}
