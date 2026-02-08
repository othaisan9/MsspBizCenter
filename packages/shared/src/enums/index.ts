// Task 관련
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Meeting 관련
export enum MeetingType {
  REGULAR = 'regular',
  ADHOC = 'adhoc',
  REVIEW = 'review',
  RETROSPECTIVE = 'retrospective',
}

export enum MeetingNoteStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum AttendanceType {
  ATTENDED = 'attended',
  ABSENT = 'absent',
  OPTIONAL = 'optional',
}

export enum ActionItemStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

// Contract 관련
export enum ContractType {
  SERVICE = 'service',
  LICENSE = 'license',
  MAINTENANCE = 'maintenance',
  NDA = 'nda',
  MOU = 'mou',
  OTHER = 'other',
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed',
}

// User 관련
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

// Audit 관련
export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  VIEWED = 'viewed',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

// Product 관련
export enum ProductType {
  PLATFORM = 'platform',
  REPORT = 'report',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// 결제 관련
export enum PaymentCycle {
  LUMP_SUM = 'lump_sum',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum CommissionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}
