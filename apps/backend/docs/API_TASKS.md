# Tasks API Documentation

## Overview
Task 모듈은 주차별 업무 관리 기능을 제공합니다.

## Endpoints

### 1. Create Task
**POST** `/api/v1/tasks`

담당자가 새로운 작업을 생성합니다.

**권한**: OWNER, ADMIN, EDITOR, ANALYST

**Request Body**:
```json
{
  "title": "API 개발 및 테스트",
  "description": "Task CRUD API를 개발하고 단위 테스트를 작성합니다.",
  "weekNumber": 6,
  "year": 2026,
  "status": "pending",
  "priority": "high",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440000",
  "dueDate": "2026-02-14T23:59:59Z",
  "estimatedHours": 8.5,
  "tags": ["backend", "api", "high-priority"],
  "parentTaskId": null
}
```

**Response**: `201 Created`
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "title": "API 개발 및 테스트",
  "description": "Task CRUD API를 개발하고 단위 테스트를 작성합니다.",
  "weekNumber": 6,
  "year": 2026,
  "status": "pending",
  "priority": "high",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440000",
  "dueDate": "2026-02-14T23:59:59.000Z",
  "estimatedHours": 8.5,
  "actualHours": null,
  "tags": ["backend", "api", "high-priority"],
  "parentTaskId": null,
  "attachments": null,
  "createdBy": "550e8400-e29b-41d4-a716-446655440002",
  "tenantId": "tenant-123",
  "createdAt": "2026-02-07T22:00:00.000Z",
  "updatedAt": "2026-02-07T22:00:00.000Z"
}
```

---

### 2. Get Tasks (Paginated)
**GET** `/api/v1/tasks`

작업 목록을 조회합니다. 페이지네이션, 필터링, 검색을 지원합니다.

**권한**: 모든 역할

**Query Parameters**:
- `page` (optional, default: 1): 페이지 번호
- `limit` (optional, default: 20): 페이지당 항목 수
- `sortBy` (optional, default: 'createdAt'): 정렬 필드
- `sortOrder` (optional, default: 'DESC'): 정렬 순서 (ASC/DESC)
- `status` (optional): 작업 상태 필터 (pending, in_progress, review, completed, cancelled)
- `priority` (optional): 우선순위 필터 (critical, high, medium, low)
- `assigneeId` (optional): 담당자 ID 필터
- `weekNumber` (optional): 주차 번호 필터 (1-53)
- `year` (optional): 연도 필터
- `search` (optional): 검색어 (제목/설명)

**Example Request**:
```
GET /api/v1/tasks?page=1&limit=20&status=in_progress&priority=high&search=API
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "title": "API 개발 및 테스트",
      "description": "Task CRUD API를 개발하고 단위 테스트를 작성합니다.",
      "weekNumber": 6,
      "year": 2026,
      "status": "in_progress",
      "priority": "high",
      "assigneeId": "550e8400-e29b-41d4-a716-446655440000",
      "assignee": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "박안도",
        "email": "ando@example.com"
      },
      "creator": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "박서연",
        "email": "seoyeon@example.com"
      },
      "dueDate": "2026-02-14T23:59:59.000Z",
      "estimatedHours": 8.5,
      "actualHours": null,
      "tags": ["backend", "api", "high-priority"],
      "parentTaskId": null,
      "attachments": null,
      "createdBy": "550e8400-e29b-41d4-a716-446655440002",
      "tenantId": "tenant-123",
      "createdAt": "2026-02-07T22:00:00.000Z",
      "updatedAt": "2026-02-07T22:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3. Get Weekly Tasks
**GET** `/api/v1/tasks/weekly`

특정 주차의 작업 목록을 조회합니다.

**권한**: 모든 역할

**Query Parameters**:
- `year` (required): 연도
- `week` (required): 주차 번호 (1-53)

**Example Request**:
```
GET /api/v1/tasks/weekly?year=2026&week=6
```

**Response**: `200 OK`
```json
[
  {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "title": "API 개발 및 테스트",
    "weekNumber": 6,
    "year": 2026,
    "status": "in_progress",
    "priority": "high",
    "assignee": { ... },
    "creator": { ... },
    ...
  }
]
```

---

### 4. Get Task by ID
**GET** `/api/v1/tasks/:id`

작업 상세 정보를 조회합니다.

**권한**: 모든 역할

**Path Parameters**:
- `id` (UUID): 작업 ID

**Response**: `200 OK`
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "title": "API 개발 및 테스트",
  "description": "Task CRUD API를 개발하고 단위 테스트를 작성합니다.",
  "weekNumber": 6,
  "year": 2026,
  "status": "in_progress",
  "priority": "high",
  "assignee": { ... },
  "creator": { ... },
  "subTasks": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440003",
      "title": "Entity 작성",
      "status": "completed",
      ...
    }
  ],
  ...
}
```

---

### 5. Update Task
**PATCH** `/api/v1/tasks/:id`

작업 정보를 수정합니다.

**권한**: OWNER, ADMIN, EDITOR, ANALYST

**Path Parameters**:
- `id` (UUID): 작업 ID

**Request Body**: (모든 필드 optional)
```json
{
  "title": "API 개발 및 통합 테스트",
  "description": "수정된 설명",
  "status": "review",
  "priority": "critical",
  "actualHours": 10.5,
  "tags": ["backend", "api", "critical"]
}
```

**Response**: `200 OK`

---

### 6. Delete Task
**DELETE** `/api/v1/tasks/:id`

작업을 삭제합니다.

**권한**: OWNER, ADMIN

**Path Parameters**:
- `id` (UUID): 작업 ID

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

### 7. Update Task Status
**PATCH** `/api/v1/tasks/:id/status`

작업 상태를 변경합니다.

**권한**: OWNER, ADMIN, EDITOR, ANALYST

**Path Parameters**:
- `id` (UUID): 작업 ID

**Request Body**:
```json
{
  "status": "completed"
}
```

**Response**: `200 OK`

---

### 8. Assign Task
**PATCH** `/api/v1/tasks/:id/assign`

작업 담당자를 할당합니다.

**권한**: OWNER, ADMIN, EDITOR, ANALYST

**Path Parameters**:
- `id` (UUID): 작업 ID

**Request Body**:
```json
{
  "assigneeId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**: `200 OK`

---

## Enums

### TaskStatus
```typescript
enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

### TaskPriority
```typescript
enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}
```

---

## Security

모든 API는 JWT Bearer 토큰 인증이 필요합니다.

**Request Header**:
```
Authorization: Bearer <JWT_TOKEN>
```

JWT 토큰에서 `tenantId`와 `userId`를 추출하여 모든 쿼리에 자동으로 테넌트 격리를 적용합니다.

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["title should not be empty", "weekNumber must be between 1 and 53"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Task with ID 650e8400-e29b-41d4-a716-446655440001 not found",
  "error": "Not Found"
}
```

---

## Swagger Documentation

실행 중인 서버에서 Swagger UI를 통해 대화형 API 문서를 확인할 수 있습니다.

**URL**: `http://localhost:4001/api/docs`

---

## Database Schema

### weekly_tasks Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | - | 테넌트 ID (FK) |
| title | VARCHAR(200) | NO | - | 작업 제목 |
| description | TEXT | YES | NULL | 작업 설명 |
| week_number | INT | NO | - | 주차 번호 (1-53) |
| year | INT | NO | - | 연도 |
| status | ENUM | NO | 'pending' | 작업 상태 |
| priority | ENUM | NO | 'medium' | 우선순위 |
| assignee_id | UUID | YES | NULL | 담당자 ID (FK to users) |
| due_date | TIMESTAMP | YES | NULL | 마감일 |
| estimated_hours | DECIMAL(5,2) | YES | NULL | 예상 소요 시간 |
| actual_hours | DECIMAL(5,2) | YES | NULL | 실제 소요 시간 |
| tags | TEXT[] | YES | ARRAY[]::text[] | 태그 목록 |
| parent_task_id | UUID | YES | NULL | 상위 작업 ID (자기 참조 FK) |
| attachments | JSONB | YES | NULL | 첨부파일 정보 |
| created_by | UUID | NO | - | 작성자 ID (FK to users) |
| created_at | TIMESTAMP | NO | NOW() | 생성일시 |
| updated_at | TIMESTAMP | NO | NOW() | 수정일시 |

**Indexes**:
- `idx_tasks_tenant_year_week` (tenant_id, year, week_number)
- `idx_tasks_tenant_assignee` (tenant_id, assignee_id)
- `idx_tasks_tenant_status` (tenant_id, status)

---

## Implementation Notes

1. **멀티테넌시**: 모든 쿼리에 `tenantId` 필터가 자동으로 적용됩니다.
2. **권한 관리**: `@Roles()` 데코레이터와 `RolesGuard`를 통해 엔드포인트별 접근 제어를 수행합니다.
3. **검증**: class-validator를 사용한 DTO 검증이 자동으로 수행됩니다.
4. **페이지네이션**: 기본 페이지 크기는 20이며, 최대 100까지 설정 가능합니다.
5. **검색**: 제목과 설명에 대해 ILIKE를 사용한 대소문자 무시 검색을 지원합니다.
