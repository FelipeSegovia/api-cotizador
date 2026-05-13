import { ApiProperty } from '@nestjs/swagger';
import type { QuotationStatus } from '../../entities/quotation.entity';
import { QuotationItemResponseDto } from './quotation-item.dto';
import { QUOTATION_STATUSES } from './create-quotation.dto';

export class QuotationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Constructora Carlos S.A' })
  clientName!: string;

  @ApiProperty({ example: '76.349.234-1', nullable: true })
  clientRut!: string | null;

  @ApiProperty({
    example: 'factura@constructoracarlos.cl',
    nullable: true,
  })
  clientEmail!: string | null;

  @ApiProperty({ example: 'Renovación Casa', nullable: true })
  projectTitle!: string | null;

  @ApiProperty({ example: '2026-12-05', nullable: true })
  projectDeadline!: string | null;

  @ApiProperty({ example: '', nullable: true })
  projectNotes!: string | null;

  @ApiProperty({
    example: '2026-06-30',
    nullable: true,
    description: 'Validez de la oferta (solo fecha).',
  })
  validUntil!: string | null;

  @ApiProperty({ enum: QUOTATION_STATUSES, example: 'draft' })
  status!: QuotationStatus;

  @ApiProperty({ type: [QuotationItemResponseDto] })
  items!: QuotationItemResponseDto[];

  @ApiProperty({ example: 2000000 })
  total!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
