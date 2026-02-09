import { UserRole } from '../enums';

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
  role: UserRole;
  iat?: number;
  exp?: number;
}

// JWT validate() 결과 (request.user에 할당되는 객체)
export interface RequestUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
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

// API Response Types
export * from './api-responses';
