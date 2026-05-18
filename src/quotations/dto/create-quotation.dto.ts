import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import type { QuotationStatus } from '../../entities/quotation.entity';
import { QuotationItemInputDto } from './quotation-item.dto';

export const QUOTATION_STATUSES: QuotationStatus[] = [
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired',
];

export class CreateQuotationDto {
  @ApiProperty({ example: 'Constructora Carlos S.A' })
  @IsString()
  @Length(1, 255)
  clientName!: string;

  @ApiPropertyOptional({ example: '76.349.234-1' })
  @IsOptional()
  @IsString()
  @Length(0, 32)
  clientRut?: string;

  @ApiPropertyOptional({ example: 'factura@constructoracarlos.cl' })
  @IsOptional()
  @IsString()
  @IsEmail()
  clientEmail?: string;

  @ApiPropertyOptional({ example: 'Renovación Casa' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  projectTitle?: string;

  @ApiPropertyOptional({
    example: '2026-12-05',
    description: 'Fecha límite del proyecto (string libre, puede venir vacío).',
  })
  @IsOptional()
  @IsString()
  @Length(0, 32)
  projectDeadline?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  projectNotes?: string;

  @ApiPropertyOptional({
    example: '2026-06-30',
    description:
      'Validez de la oferta (solo fecha ISO). Si la fecha ya pasó y el estado almacenado es borrador o enviado, la API expondrá el estado `expired`.',
  })
  @Transform(({ value }: { value: unknown }): string | undefined => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value : undefined;
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ type: [QuotationItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemInputDto)
  items!: QuotationItemInputDto[];

  @ApiPropertyOptional({
    enum: QUOTATION_STATUSES,
    example: 'draft',
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(QUOTATION_STATUSES)
  status?: QuotationStatus;
}
