import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const QUOTATION_CLIENT_STATUSES = ['approved', 'rejected'] as const;

export type QuotationClientStatus = (typeof QUOTATION_CLIENT_STATUSES)[number];

export class UpdateQuotationStatusDto {
  @ApiProperty({ enum: QUOTATION_CLIENT_STATUSES, example: 'approved' })
  @IsIn(QUOTATION_CLIENT_STATUSES)
  status!: QuotationClientStatus;
}
