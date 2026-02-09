/**
 * Frontend API 응답 타입 정의
 * Backend entity/service 응답 형태와 1:1 매칭
 */
import {
  TaskStatus,
  TaskPriority,
  MeetingType,
  MeetingNoteStatus,
  AttendanceType,
  ActionItemStatus,
  ContractType,
  ContractStatus,
  UserRole,
  AuditAction,
  ProductStatus,
  ContractSourceType,
  UserAffiliation,
} from '../enums';

// ─── Common ───────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── User ─────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  affiliation: UserAffiliation;
  affiliationName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Task ─────────────────────────────────────────────────

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  weekNumber: number;
  year: number;
  assigneeId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  createdBy: string;
  creator: { id: string; name: string; email: string };
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[] | null;
  parentTaskId: string | null;
  attachments: Record<string, unknown>[] | null;
  subTasks?: TaskResponse[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  success: boolean;
  data: TaskResponse[];
  meta: PaginationMeta;
}

// ─── Meeting ──────────────────────────────────────────────

export interface AgendaItem {
  title: string;
  description?: string;
}

export interface DecisionItem {
  title: string;
  description?: string;
}

export interface MeetingAttendeeResponse {
  id: string;
  meetingId: string;
  userId: string;
  attendanceType: AttendanceType;
  user: { id: string; name: string; email: string };
}

export interface MeetingActionItemResponse {
  id: string;
  title: string;
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  dueDate: string | null;
  status: ActionItemStatus;
  taskId: string | null;
}

export interface MeetingResponse {
  id: string;
  title: string;
  meetingDate: string;
  location: string | null;
  meetingType: MeetingType;
  agenda: AgendaItem[] | null;
  content: string | null;
  decisions: DecisionItem[] | null;
  status: MeetingNoteStatus;
  createdBy: string;
  creator: { id: string; name: string; email: string };
  attendees: MeetingAttendeeResponse[];
  actionItems: MeetingActionItemResponse[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingListResponse {
  data: MeetingResponse[];
  meta: PaginationMeta;
}

// ─── Contract ─────────────────────────────────────────────

export interface ContractProductResponse {
  id: string;
  contractId: string;
  productId: string;
  product: { id: string; name: string; code: string; description?: string | null };
  productOptionId: string | null;
  productOption: { id: string; name: string; code: string; description?: string | null; type?: string | null } | null;
  quantity: number;
  notes: string | null;
}

export interface ContractResponse {
  id: string;
  title: string;
  contractNumber: string | null;
  contractType: ContractType;
  status: ContractStatus;
  sourceType: ContractSourceType;
  originalVendor: string | null;
  partyA: string;
  partyB: string;
  partyBContact?: Array<{ platform?: string; name?: string; email?: string }> | null;
  startDate: string;
  endDate: string | null;
  currency: string | null;
  paymentTerms: string | null;
  paymentCycle: string | null;
  vatIncluded: boolean;
  description: string | null;
  memo: string | null;
  // 금액 (복호화 후 포함)
  amountEncrypted?: string;
  amount?: number;
  purchasePriceEncrypted?: string;
  purchasePrice?: number;
  purchaseCommissionRate?: number | null;
  sellingPriceEncrypted?: string;
  sellingPrice?: number;
  // 파트너
  hasPartner: boolean;
  partnerName: string | null;
  commissionType: string | null;
  partnerCommission: number | null;
  // 담당자
  createdBy: string;
  creator?: { id: string; name: string; email: string };
  internalManagerId: string | null;
  internalManager?: { id: string; name: string; email: string } | null;
  // 갱신
  autoRenewal: boolean | null;
  renewalNoticeDays: number | null;
  parentContractId: string | null;
  parentContract?: ContractResponse | null;
  renewals?: ContractResponse[];
  // 알림
  notifyBefore30Days: boolean;
  notifyBefore7Days: boolean;
  notifyOnExpiry: boolean;
  // 제품
  contractProducts?: ContractProductResponse[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractListResponse {
  items: ContractResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractDashboardResponse {
  total: number;
  byStatus: Array<{ status: ContractStatus; count: number }>;
  byType: Array<{ type: string; count: number }>;
  expiring: { within30Days: number; within7Days: number };
}

export interface ContractHistoryResponse {
  id: string;
  contractId: string;
  action: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedBy: string;
  changedAt: string;
  changer?: { id: string; name: string; email: string };
}

// ─── Product ──────────────────────────────────────────────

export interface ProductOptionResponse {
  id: string;
  productId: string;
  code: string;
  name: string;
  description: string | null;
  type: string | null;
  isActive: boolean;
  displayOrder: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  vendor: string | null;
  displayOrder: number;
  options: ProductOptionResponse[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── File ─────────────────────────────────────────────────

export interface FileResponse {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
  entityType: string | null;
  entityId: string | null;
  uploadedById: string;
  uploadedBy?: { id: string; name: string; email: string };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Stats ────────────────────────────────────────────────

export interface DashboardStatsResponse {
  totalTasks: number;
  completedThisWeek: number;
  inProgressTasks: number;
  totalMeetings: number;
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
}

export interface WeeklyTaskStatsResponse {
  year: number;
  week: number;
  total: number;
  completed: number;
  inProgress: number;
}

export interface MonthlyContractStatsResponse {
  year: number;
  month: number;
  newContracts: number;
  renewals: number;
  totalAmount: number;
}

export interface TasksByStatusResponse {
  status: TaskStatus;
  count: number;
  percentage: number;
}

export interface TasksByPriorityResponse {
  priority: TaskPriority;
  count: number;
  percentage: number;
}

// ─── Audit ────────────────────────────────────────────────

export interface AuditLogResponse {
  id: string;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  userId: string | null;
  userEmail: string | null;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  tenantId: string;
  createdAt: string;
}

export interface AuditListResponse {
  data: AuditLogResponse[];
  meta: PaginationMeta;
}

// ─── AI Settings ──────────────────────────────────────────

export interface AiSettingsResponse {
  provider: string;
  defaultModel: string;
  fastModel: string;
  isEnabled: boolean;
  monthlyBudgetLimit: number | null;
  ollamaBaseUrl: string | null;
  hasApiKey: boolean;
}
