import type { Feedback } from '../entities/feedback.entity';
import type { FeedbackResponseDto } from './dto/feedback-response.dto';

export function toFeedbackResponse(entity: Feedback): FeedbackResponseDto {
  return {
    id: entity.id,
    userId: entity.userId,
    userEmail: entity.userEmail,
    title: entity.title,
    category: entity.category,
    description: entity.description,
    status: entity.status,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
