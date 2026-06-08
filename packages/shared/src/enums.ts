export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROSPECT = 'PROSPECT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  OTHER = 'OTHER',
}

export enum InteractionType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  MESSAGE = 'MESSAGE',
  OTHER = 'OTHER',
}

export enum EntityType {
  CLIENT = 'CLIENT',
  COMPANY = 'COMPANY',
  CONTACT = 'CONTACT',
  OPPORTUNITY = 'OPPORTUNITY',
  TASK = 'TASK',
  NOTE = 'NOTE',
  ACTIVITY = 'ACTIVITY',
}

export enum NotificationType {
  REMINDER = 'REMINDER',
  TASK_OVERDUE = 'TASK_OVERDUE',
  OPPORTUNITY_STALE = 'OPPORTUNITY_STALE',
  FOLLOW_UP = 'FOLLOW_UP',
  SYSTEM = 'SYSTEM',
}

export enum OpportunityStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}
