import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  FEEDBACK_STATUSES,
  type FeedbackStatus,
} from '../enums/feedback-status.enum';

export class UpdateFeedbackStatusDto {
  @ApiProperty({ enum: FEEDBACK_STATUSES, example: 'reviewed' })
  @IsIn([...FEEDBACK_STATUSES], { message: 'Estado inválido' })
  status!: FeedbackStatus;
}
