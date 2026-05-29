import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  FEEDBACK_PRIORITIES,
  type FeedbackPriority,
} from '../enums/feedback-priority.enum';

export class UpdateFeedbackPriorityDto {
  @ApiProperty({ enum: FEEDBACK_PRIORITIES, example: 'high' })
  @IsIn([...FEEDBACK_PRIORITIES], { message: 'Prioridad inválida' })
  priority!: FeedbackPriority;
}
