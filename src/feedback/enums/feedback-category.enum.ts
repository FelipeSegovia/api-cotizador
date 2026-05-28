export const FEEDBACK_CATEGORIES = [
  'idea',
  'feature',
  'improvement',
  'complaint',
  'opinion',
  'bug',
  'other',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
