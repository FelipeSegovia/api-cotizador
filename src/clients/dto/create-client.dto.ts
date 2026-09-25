import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
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

  @ApiPropertyOptional({
    type: [String],
    example: ['ana@anatorres.com', 'hola@anatorres.com'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsEmail({}, { each: true })
  emails?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['+34 600 123 456', '+34 911 000 111'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(1, 64, { each: true })
  phones?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['matriculas', 'rondas-app'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 40, { each: true })
  tags?: string[];
}
