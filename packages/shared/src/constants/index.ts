export const APP_NAME = 'MsspBizCenter';
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// 페이지네이션 기본값
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// 파일 업로드
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'txt'];

// JWT
export const JWT_ACCESS_EXPIRES = 3600;        // 1시간
export const JWT_REFRESH_EXPIRES = 604800;     // 7일

// 감사 로그
export const AUDIT_RETENTION_DAYS = 90;

// 계약 알림
export const CONTRACT_ALERT_DAYS = [30, 7];    // 만료 30일, 7일 전
