export const FEEDBACK_PRIORITIES = ['high', 'medium', 'low'] as const;

export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];
