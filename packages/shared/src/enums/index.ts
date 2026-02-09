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
  POC_DEMO = 'poc_demo',
}

// User 관련
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
  SALES = 'sales',
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
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// 거래 유형
export enum ContractSourceType {
  DIRECT = 'direct',           // 자사 직접 판매
  RESELLING = 'reselling',     // 리셀링 (벤더 제품 재판매)
  VENDOR_DIRECT = 'vendor_direct', // 벤더 직계약 중개
}

// 사용자 소속
export enum UserAffiliation {
  INTERNAL = 'internal',       // 자사 (내부 직원)
  VENDOR = 'vendor',           // 벤더사
  PARTNER = 'partner',         // 파트너사
  CLIENT = 'client',           // 고객사
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
