import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
} from '../enums/feedback-category.enum';
import {
  FEEDBACK_PRIORITIES,
  type FeedbackPriority,
} from '../enums/feedback-priority.enum';
import {
  FEEDBACK_STATUSES,
  type FeedbackStatus,
} from '../enums/feedback-status.enum';

export class FindAllFeedbackQueryDto {
  @ApiPropertyOptional({ enum: FEEDBACK_STATUSES })
  @IsOptional()
  @IsIn([...FEEDBACK_STATUSES], { message: 'Estado inválido' })
  status?: FeedbackStatus;

  @ApiPropertyOptional({ enum: FEEDBACK_CATEGORIES })
  @IsOptional()
  @IsIn([...FEEDBACK_CATEGORIES], { message: 'Categoría inválida' })
  category?: FeedbackCategory;

  @ApiPropertyOptional({ enum: FEEDBACK_PRIORITIES })
  @IsOptional()
  @IsIn([...FEEDBACK_PRIORITIES], { message: 'Prioridad inválida' })
  priority?: FeedbackPriority;
}
