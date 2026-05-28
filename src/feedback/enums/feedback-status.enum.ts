export const FEEDBACK_STATUSES = [
  'pending',
  'reviewed',
  'planned',
  'done',
  'rejected',
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
