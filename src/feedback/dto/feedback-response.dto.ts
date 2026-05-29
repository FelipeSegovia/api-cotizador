import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FEEDBACK_CATEGORIES } from '../enums/feedback-category.enum';
import type { FeedbackCategory } from '../enums/feedback-category.enum';
import { FEEDBACK_PRIORITIES } from '../enums/feedback-priority.enum';
import type { FeedbackPriority } from '../enums/feedback-priority.enum';
import { FEEDBACK_STATUSES } from '../enums/feedback-status.enum';
import type { FeedbackStatus } from '../enums/feedback-status.enum';

export class FeedbackResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ example: 'usuario@ejemplo.cl' })
  userEmail!: string;

  @ApiPropertyOptional({ example: 'Felipe Segovia' })
  userName?: string;

  @ApiProperty({ example: 'Exportar cotizaciones a Excel' })
  title!: string;

  @ApiProperty({ enum: FEEDBACK_CATEGORIES, example: 'feature' })
  category!: FeedbackCategory;

  @ApiProperty({
    example:
      'Sería útil poder exportar el listado de cotizaciones a Excel para reportes internos.',
  })
  description!: string;

  @ApiProperty({ enum: FEEDBACK_STATUSES, example: 'pending' })
  status!: FeedbackStatus;

  @ApiProperty({ enum: FEEDBACK_PRIORITIES, example: 'medium' })
  priority!: FeedbackPriority;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
