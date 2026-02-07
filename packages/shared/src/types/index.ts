// API 공통 응답
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// JWT Payload
export interface JwtPayload {
  sub: string;        // userId
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 기본 Entity 필드
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantEntity extends BaseEntity {
  tenantId: string;
}
