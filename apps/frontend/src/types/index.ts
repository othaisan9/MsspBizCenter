// User & Auth Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

// Task Types
export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  assignee?: User
  dueDate: string | null
  weekNumber: number
  year: number
  tenantId: string
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
  comments?: TaskComment[]
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface TaskComment {
  id: string
  taskId: string
  content: string
  authorId: string
  author?: User
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  description: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
}

// Meeting Types
export interface MeetingNote {
  id: string
  title: string
  content: string
  meetingDate: string
  location: string | null
  status: MeetingStatus
  tenantId: string
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
  attendees?: MeetingAttendee[]
  actionItems?: ActionItem[]
}

export enum MeetingStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export interface MeetingAttendee {
  id: string
  meetingNoteId: string
  userId: string
  user?: User
  createdAt: string
}

export interface ActionItem {
  id: string
  meetingNoteId: string
  description: string
  assigneeId: string | null
  assignee?: User
  dueDate: string | null
  completed: boolean
  linkedTaskId: string | null
  linkedTask?: Task
  createdAt: string
  updatedAt: string
}

export interface CreateMeetingDto {
  title: string
  content: string
  meetingDate: string
  location?: string | null
  status?: MeetingStatus
  attendeeIds?: string[]
}

export interface UpdateMeetingDto {
  title?: string
  content?: string
  meetingDate?: string
  location?: string | null
  status?: MeetingStatus
}

// Contract Types
export interface Contract {
  id: string
  clientName: string
  contractNumber: string
  startDate: string
  endDate: string
  amount: string // 암호화된 값
  status: ContractStatus
  description: string | null
  tenantId: string
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
  history?: ContractHistory[]
}

export enum ContractStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  RENEWED = 'renewed',
  CANCELLED = 'cancelled',
}

export interface ContractHistory {
  id: string
  contractId: string
  action: string
  changedFields: Record<string, any>
  performedById: string
  performedBy?: User
  createdAt: string
}

export interface CreateContractDto {
  clientName: string
  contractNumber: string
  startDate: string
  endDate: string
  amount: number
  status?: ContractStatus
  description?: string | null
}

export interface UpdateContractDto {
  clientName?: string
  contractNumber?: string
  startDate?: string
  endDate?: string
  amount?: number
  status?: ContractStatus
  description?: string | null
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
