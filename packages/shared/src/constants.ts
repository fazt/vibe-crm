export const DEFAULT_PIPELINE_STAGES = [
  { name: 'Lead', color: '#6366f1', order: 0, isWon: false, isLost: false },
  { name: 'Qualified', color: '#8b5cf6', order: 1, isWon: false, isLost: false },
  { name: 'Proposal', color: '#a855f7', order: 2, isWon: false, isLost: false },
  { name: 'Negotiation', color: '#d946ef', order: 3, isWon: false, isLost: false },
  { name: 'Won', color: '#22c55e', order: 4, isWon: true, isLost: false },
  { name: 'Lost', color: '#ef4444', order: 5, isWon: false, isLost: true },
] as const;

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;
export const STALE_OPPORTUNITY_DAYS = 14;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
