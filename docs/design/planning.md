# MsspBizCenter 기획 문서

> **작성일**: 2026-02-07
> **작성자**: 박서연 (PM)
> **버전**: v1.2
> **상태**: 승인됨
> **최종 수정**: 2026-02-07 - 독립 플랫폼 전환 (NestJS + Next.js, PostgreSQL)

## ⚠️ 기술 스택 변경 (v1.2)

**변경 사유**: 독립 플랫폼 전환 - CTEM 코드 재활용 + 풀스택 TypeScript 통일

| 항목 | v1.0 (초안) | v1.1 (미시시피 통합) | v1.2 (독립 플랫폼) |
|------|-------------|---------------------|---------------------|
| Frontend | Next.js 15 + React 19 | React 19 + Vite | **Next.js 15 + React 19** |
| Backend | NestJS 10 + TypeORM | Flask 3.x + SQLAlchemy | **NestJS 10 + TypeORM** |
| Database | PostgreSQL 15 | MariaDB 10.x | **PostgreSQL 16** |
| Monorepo | pnpm + Turborepo | - | **pnpm 9 + Turborepo 2** |
| 기타 | - | SSO 통합 계획 | CTEM 코드 재활용 |

**v1.1 → v1.2 변경 사유**:
- 미시시피와의 SSO 통합 전제 해제 → 독립 플랫폼으로 전환
- CTEM 프로젝트 (NestJS + Next.js + PostgreSQL)의 검증된 모듈 재활용
- 풀스택 TypeScript로 Backend/Frontend 타입 공유
- Node.js 단일 런타임으로 인프라 단순화

**DB 참고 (PostgreSQL 네이티브)**:
- `JSONB` 타입 사용 (인덱싱 가능)
- `TSVECTOR` 전문 검색 (가중치 지원)
- `uuid_generate_v4()` 사용
- Row-Level Security (RLS) 정책 적용 가능

---

## 1. 프로젝트 개요

### 1.1 배경

캡틴께서 팀 협업 및 업무 관리를 위한 **팀 업무포털** 기능 개발을 요청하셨습니다. CTEM 프로젝트에서 검증된 기술 스택(NestJS + Next.js + PostgreSQL)을 재활용하여 독립 플랫폼으로 개발합니다.

### 1.2 목표

- 주차별 업무 일지를 통한 Task 관리 및 진행 상황 추적
- 회의록 작성/관리를 통한 의사결정 이력 보존
- 계약 정보의 체계적 관리 및 만료 알림

### 1.3 범위

| 포함 | 제외 |
|------|------|
| 주차별 업무 일지 (Task) | 외부 프로젝트 관리 도구 연동 (Jira, Asana 등) |
| 회의록 관리 | 화상 회의 기능 |
| 계약 관리 | 전자 계약/서명 기능 |
| 감사 로그 | 회계 시스템 연동 |

### 1.4 기술 스택

```json
{
  "frontend": "Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS",
  "backend": "NestJS 10 + TypeORM 0.3.x + PostgreSQL 16",
  "infra": "Docker Compose + Redis + pnpm Workspaces + Turborepo",
  "testing": "Jest (Backend) + Vitest (Frontend) + Playwright (E2E)"
}
```

---

## 2. 기능 정의

### 2.1 Task (주차별 업무 일지)

#### 2.1.1 요구사항

- 주차 단위로 업무(Task) 등록/관리
- 담당자 지정 및 진행 상태 추적
- 우선순위 및 마감일 관리
- 주간 리포트 자동 생성
- 상위/하위 Task 관계 지원 (Sub-Task)

#### 2.1.2 주요 필드

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| tenantId | UUID | O | 테넌트 ID |
| title | VARCHAR(200) | O | Task 제목 |
| description | TEXT | X | 상세 설명 (Markdown 지원) |
| weekNumber | INT | O | 해당 연도의 주차 (1-53) |
| year | INT | O | 연도 |
| status | ENUM | O | pending/in_progress/review/completed/cancelled |
| priority | ENUM | O | critical/high/medium/low |
| assigneeId | UUID | X | 담당자 (User FK) |
| dueDate | TIMESTAMP | X | 마감일 |
| estimatedHours | DECIMAL(5,2) | X | 예상 소요 시간 |
| actualHours | DECIMAL(5,2) | X | 실제 소요 시간 |
| tags | TEXT[] | X | 태그 목록 |
| parentTaskId | UUID | X | 상위 Task (Self FK) |
| attachments | JSONB | X | 첨부파일 목록 |
| createdBy | UUID | O | 생성자 (User FK) |
| createdAt | TIMESTAMP | O | 생성일시 |
| updatedAt | TIMESTAMP | O | 수정일시 |

#### 2.1.3 상태 정의

```typescript
enum TaskStatus {
  PENDING = 'pending',         // 대기 중
  IN_PROGRESS = 'in_progress', // 진행 중
  REVIEW = 'review',           // 검토 중
  COMPLETED = 'completed',     // 완료
  CANCELLED = 'cancelled',     // 취소
}

enum TaskPriority {
  CRITICAL = 'critical',  // 긴급
  HIGH = 'high',          // 높음
  MEDIUM = 'medium',      // 보통
  LOW = 'low',            // 낮음
}
```

#### 2.1.4 기능 목록

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| CRUD | Task 생성/조회/수정/삭제 | P0 |
| 주차 뷰 | 주차별 Task 목록 조회 | P0 |
| 상태 변경 | 드래그 앤 드롭으로 상태 변경 (칸반 보드) | P1 |
| 담당자 할당 | 팀원에게 Task 할당 | P0 |
| 필터링 | 상태/담당자/우선순위별 필터 | P0 |
| 검색 | 제목/설명 검색 | P0 |
| Sub-Task | 상위/하위 Task 관계 | P1 |
| 첨부파일 | 파일 첨부 (최대 10MB) | P1 |
| 주간 리포트 | 주간 업무 요약 리포트 생성 | P2 |
| 반복 Task | 매주 반복되는 Task 템플릿 | P2 |
| 댓글 | Task별 댓글/논의 | P2 |

---

### 2.2 Meeting (회의록)

#### 2.2.1 요구사항

- 회의 정보 (제목, 일시, 장소) 기록
- 참석자 관리 (참석/불참)
- 안건 및 결정사항 기록
- 후속 조치 (Action Items) 관리 및 Task 연동
- 회의록 템플릿 지원

#### 2.2.2 주요 필드

**MeetingNote (회의록)**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| tenantId | UUID | O | 테넌트 ID |
| title | VARCHAR(255) | O | 회의 제목 |
| meetingDate | TIMESTAMP | O | 회의 일시 |
| location | VARCHAR(255) | X | 회의 장소/채널 |
| meetingType | ENUM | O | regular/adhoc/review/retrospective |
| agenda | JSONB | X | 안건 목록 |
| content | TEXT | X | 회의 내용 (Markdown) |
| decisions | JSONB | X | 결정사항 목록 |
| attachments | JSONB | X | 첨부파일 목록 |
| status | ENUM | O | draft/published |
| createdBy | UUID | O | 작성자 (User FK) |
| createdAt | TIMESTAMP | O | 생성일시 |
| updatedAt | TIMESTAMP | O | 수정일시 |
| searchVector | TSVECTOR | X | 전문 검색용 (PostgreSQL) |

**MeetingAttendee (참석자)**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| meetingId | UUID | O | 회의록 FK |
| userId | UUID | O | 사용자 FK |
| attendanceType | ENUM | O | attended/absent/optional |

**ActionItem (후속 조치)**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| meetingId | UUID | O | 회의록 FK |
| title | VARCHAR(255) | O | Action Item 제목 |
| assigneeId | UUID | X | 담당자 (User FK) |
| dueDate | TIMESTAMP | X | 마감일 |
| status | ENUM | O | pending/completed |
| taskId | UUID | X | 연결된 Task FK |

#### 2.2.3 회의 유형

```typescript
enum MeetingType {
  REGULAR = 'regular',           // 정기 회의
  ADHOC = 'adhoc',               // 임시 회의
  REVIEW = 'review',             // 리뷰 회의
  RETROSPECTIVE = 'retrospective', // 회고
}

enum MeetingNoteStatus {
  DRAFT = 'draft',       // 초안
  PUBLISHED = 'published', // 발행됨
}

enum AttendanceType {
  ATTENDED = 'attended',  // 참석
  ABSENT = 'absent',      // 불참
  OPTIONAL = 'optional',  // 선택 참석
}
```

#### 2.2.4 기능 목록

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| CRUD | 회의록 생성/조회/수정/삭제 | P0 |
| 참석자 관리 | 참석자 추가/제거, 출결 체크 | P0 |
| Action Item | 후속 조치 등록 및 상태 관리 | P0 |
| Task 연동 | Action Item → Task 자동 생성 | P1 |
| 템플릿 | 회의 유형별 템플릿 | P1 |
| 검색 | 제목/내용 전문 검색 | P0 |
| 발행 | 회의록 발행 (참석자 알림) | P1 |
| 내보내기 | PDF/Word 내보내기 | P2 |
| 히스토리 | 수정 이력 관리 | P2 |

---

### 2.3 Contract (계약 관리)

#### 2.3.1 요구사항

- 계약 정보 등록 및 관리
- 계약 기간/금액/당사자 관리
- 만료 알림 (30일/7일 전)
- 갱신 이력 추적
- **민감 정보 암호화** (금액 등)

#### 2.3.2 주요 필드

**Contract (계약)**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| tenantId | UUID | O | 테넌트 ID |
| title | VARCHAR(255) | O | 계약 제목 |
| contractNumber | VARCHAR(100) | X | 계약 번호 |
| contractType | ENUM | O | service/license/maintenance/nda/mou/other |
| partyA | VARCHAR(255) | O | 계약 당사자 A (우리 측) |
| partyB | VARCHAR(255) | O | 계약 당사자 B (상대방) |
| partyBContact | JSONB | X | 상대방 연락처 정보 |
| startDate | DATE | O | 계약 시작일 |
| endDate | DATE | X | 계약 종료일 (무기한 가능) |
| amountEncrypted | TEXT | X | 계약 금액 (AES-256-GCM 암호화) |
| currency | VARCHAR(10) | X | 통화 (KRW, USD, JPY 등) |
| paymentTerms | TEXT | X | 결제 조건 |
| status | ENUM | O | draft/active/expired/terminated/renewed |
| autoRenewal | BOOLEAN | X | 자동 갱신 여부 |
| renewalNoticeDays | INT | X | 갱신 통보 기한 (일) |
| description | TEXT | X | 계약 내용 요약 |
| attachments | JSONB | X | 첨부파일 (계약서 스캔본 등) |
| parentContractId | UUID | X | 원계약 (갱신 시) |
| createdBy | UUID | O | 생성자 (User FK) |
| createdAt | TIMESTAMP | O | 생성일시 |
| updatedAt | TIMESTAMP | O | 수정일시 |

**ContractHistory (계약 변경 이력)**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| contractId | UUID | O | 계약 FK |
| action | ENUM | O | created/updated/renewed/terminated |
| previousData | JSONB | X | 변경 전 데이터 |
| newData | JSONB | X | 변경 후 데이터 |
| changedBy | UUID | O | 변경자 (User FK) |
| changedAt | TIMESTAMP | O | 변경일시 |

#### 2.3.3 계약 상태

```typescript
enum ContractType {
  SERVICE = 'service',         // 서비스 계약
  LICENSE = 'license',         // 라이선스 계약
  MAINTENANCE = 'maintenance', // 유지보수 계약
  NDA = 'nda',                 // 비밀유지계약
  MOU = 'mou',                 // 양해각서
  OTHER = 'other',             // 기타
}

enum ContractStatus {
  DRAFT = 'draft',           // 초안
  ACTIVE = 'active',         // 활성
  EXPIRED = 'expired',       // 만료
  TERMINATED = 'terminated', // 해지
  RENEWED = 'renewed',       // 갱신됨 (원계약)
}
```

#### 2.3.4 기능 목록

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| CRUD | 계약 생성/조회/수정/삭제 | P0 |
| 금액 암호화 | AES-256-GCM 암호화 저장 | P0 |
| 만료 알림 | 30일/7일 전 알림 | P0 |
| 대시보드 | 계약 현황 대시보드 | P0 |
| 갱신 관리 | 계약 갱신 및 이력 추적 | P1 |
| 필터링 | 상태/유형/기간별 필터 | P0 |
| 첨부파일 | 계약서 파일 업로드/다운로드 | P0 |
| 금액 집계 | 월별/연별 계약 금액 집계 | P2 |
| 접근 제어 | 역할별 상세 조회 권한 | P0 |

---

## 3. 기술 스택 상세

### 3.1 Frontend

| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | Next.js | 15.x | App Router, SSR |
| UI Library | React | 19.x | UI 컴포넌트 |
| Language | TypeScript | 5.7+ | 타입 안정성 |
| Styling | Tailwind CSS | 3.4+ | 유틸리티 CSS |
| State | SWR | 2.x | 서버 상태 관리 |
| Icons | Iconoir | 7.x | SVG 아이콘 |
| Charts | Recharts | 2.x | 데이터 시각화 |
| DnD | @dnd-kit | 6.x+ | 드래그앤드롭 |
| Testing | Vitest + Playwright | 2.x + 1.x | Unit + E2E |

### 3.2 Backend

| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | NestJS | 10.x | REST API |
| ORM | TypeORM | 0.3.x | DB 접근 |
| Database | PostgreSQL | 16+ | 메인 DB |
| Cache | Redis | 7.x | 캐시, 세션 |
| Validation | class-validator | 0.14+ | DTO 검증 |
| Auth | Passport + JWT | - | 인증 |
| API Docs | @nestjs/swagger | - | Swagger 자동 생성 |
| Testing | Jest | 29.x | Unit/E2E 테스트 |

### 3.3 Infrastructure

| 항목 | 기술 | 용도 |
|------|------|------|
| Container | Docker | 개발/배포 환경 |
| Orchestration | Docker Compose | 멀티 컨테이너 관리 |
| Monorepo | pnpm + Turborepo | 패키지 관리 |

---

## 4. DB 스키마 설계

### 4.1 ERD

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     tenants     │     │      users      │     │   weekly_tasks  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄──┐ │ id (PK)         │◄──┐ │ id (PK)         │
│ name            │   │ │ tenant_id (FK)  │   │ │ tenant_id (FK)  │
│ domain          │   │ │ email           │   └─┤ assignee_id(FK) │
│ settings        │   │ │ name            │     │ title           │
│ is_active       │   │ │ role            │     │ description     │
│ created_at      │   │ │ is_active       │     │ week_number     │
│ updated_at      │   │ │ created_at      │     │ year            │
└─────────────────┘   │ └─────────────────┘     │ status          │
                      │                         │ priority        │
                      │                         │ due_date        │
                      │                         │ parent_task_id  │◄──┐
                      │                         │ created_by (FK) │   │
                      │                         │ created_at      │   │
                      │                         │ updated_at      │───┘
                      │                         └─────────────────┘
                      │
                      │ ┌─────────────────┐     ┌─────────────────┐
                      │ │  meeting_notes  │     │meeting_attendees│
                      │ ├─────────────────┤     ├─────────────────┤
                      └─┤ tenant_id (FK)  │     │ id (PK)         │
                        │ id (PK)         │◄────┤ meeting_id (FK) │
                        │ title           │     │ user_id (FK)    │
                        │ meeting_date    │     │ attendance_type │
                        │ location        │     └─────────────────┘
                        │ meeting_type    │
                        │ content         │     ┌─────────────────┐
                        │ decisions       │     │   action_items  │
                        │ status          │     ├─────────────────┤
                        │ created_by (FK) │     │ id (PK)         │
                        │ created_at      │◄────┤ meeting_id (FK) │
                        │ updated_at      │     │ title           │
                        └─────────────────┘     │ assignee_id(FK) │
                                                │ due_date        │
                      ┌─────────────────┐       │ status          │
                      │    contracts    │       │ task_id (FK)    │──► weekly_tasks
                      ├─────────────────┤       └─────────────────┘
                      │ id (PK)         │
                      │ tenant_id (FK)  │
                      │ title           │       ┌─────────────────┐
                      │ contract_number │       │contract_history │
                      │ contract_type   │       ├─────────────────┤
                      │ party_a         │       │ id (PK)         │
                      │ party_b         │◄──────┤ contract_id(FK) │
                      │ start_date      │       │ action          │
                      │ end_date        │       │ previous_data   │
                      │ amount_encrypted│       │ new_data        │
                      │ status          │       │ changed_by (FK) │
                      │ parent_contract │◄──┐   │ changed_at      │
                      │ created_by (FK) │   │   └─────────────────┘
                      │ created_at      │   │
                      │ updated_at      │───┘
                      └─────────────────┘

                      ┌─────────────────┐       ┌─────────────────┐
                      │      files      │       │   audit_logs    │
                      ├─────────────────┤       ├─────────────────┤
                      │ id (PK)         │       │ id (PK)         │
                      │ tenant_id (FK)  │       │ tenant_id (FK)  │
                      │ filename        │       │ entity_type     │
                      │ original_name   │       │ entity_id       │
                      │ mime_type       │       │ action          │
                      │ size            │       │ user_id (FK)    │
                      │ path            │       │ details         │
                      │ uploaded_by(FK) │       │ ip_address      │
                      │ created_at      │       │ created_at      │
                      └─────────────────┘       └─────────────────┘
```

### 4.2 인덱스 전략

```sql
-- Task 인덱스
CREATE INDEX idx_tasks_tenant_week ON weekly_tasks(tenant_id, year, week_number);
CREATE INDEX idx_tasks_tenant_assignee ON weekly_tasks(tenant_id, assignee_id);
CREATE INDEX idx_tasks_tenant_status ON weekly_tasks(tenant_id, status);
CREATE INDEX idx_tasks_tenant_due ON weekly_tasks(tenant_id, due_date);

-- Meeting 인덱스
CREATE INDEX idx_meetings_tenant_date ON meeting_notes(tenant_id, meeting_date);
CREATE INDEX idx_meetings_tenant_status ON meeting_notes(tenant_id, status);
CREATE INDEX idx_meetings_search ON meeting_notes USING GIN(search_vector);

-- Contract 인덱스
CREATE INDEX idx_contracts_tenant_status ON contracts(tenant_id, status);
CREATE INDEX idx_contracts_tenant_end ON contracts(tenant_id, end_date);
CREATE INDEX idx_contracts_tenant_type ON contracts(tenant_id, contract_type);

-- Audit Log 인덱스
CREATE INDEX idx_audit_tenant_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_tenant_date ON audit_logs(tenant_id, created_at);
```

---

## 5. API 설계

### 5.1 공통 사항

- **Base URL**: `/api/v1`
- **인증**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **페이징**: `page`, `limit` 쿼리 파라미터 (기본 page=1, limit=20)
- **정렬**: `sortBy`, `sortOrder` 쿼리 파라미터

### 5.2 Task API

```
# Task CRUD
POST   /api/v1/tasks                    # Task 생성
GET    /api/v1/tasks                    # Task 목록 (필터링, 페이징)
GET    /api/v1/tasks/:id                # Task 상세
PATCH  /api/v1/tasks/:id                # Task 수정
DELETE /api/v1/tasks/:id                # Task 삭제

# 주차별 조회
GET    /api/v1/tasks/weekly             # 주차별 Task 목록
       ?year=2026&week=6

# 상태 변경
PATCH  /api/v1/tasks/:id/status         # 상태 변경
       { "status": "in_progress" }

# 할당
PATCH  /api/v1/tasks/:id/assign         # 담당자 할당
       { "assigneeId": "uuid" }

# Sub-Task
GET    /api/v1/tasks/:id/subtasks       # Sub-Task 목록
POST   /api/v1/tasks/:id/subtasks       # Sub-Task 생성

# 주간 리포트
GET    /api/v1/tasks/report/weekly      # 주간 리포트
       ?year=2026&week=6
```

### 5.3 Meeting API

```
# 회의록 CRUD
POST   /api/v1/meetings                 # 회의록 생성
GET    /api/v1/meetings                 # 회의록 목록
GET    /api/v1/meetings/:id             # 회의록 상세
PATCH  /api/v1/meetings/:id             # 회의록 수정
DELETE /api/v1/meetings/:id             # 회의록 삭제

# 발행
PATCH  /api/v1/meetings/:id/publish     # 회의록 발행

# 참석자
GET    /api/v1/meetings/:id/attendees   # 참석자 목록
POST   /api/v1/meetings/:id/attendees   # 참석자 추가
DELETE /api/v1/meetings/:id/attendees/:userId  # 참석자 제거

# Action Item
GET    /api/v1/meetings/:id/action-items           # Action Item 목록
POST   /api/v1/meetings/:id/action-items           # Action Item 생성
PATCH  /api/v1/meetings/:id/action-items/:itemId   # Action Item 수정
POST   /api/v1/meetings/:id/action-items/:itemId/convert-to-task  # Task 변환

# 검색
GET    /api/v1/meetings/search          # 전문 검색
       ?q=keyword

# 내보내기
GET    /api/v1/meetings/:id/export      # 내보내기
       ?format=pdf
```

### 5.4 Contract API

```
# 계약 CRUD
POST   /api/v1/contracts                # 계약 생성
GET    /api/v1/contracts                # 계약 목록
GET    /api/v1/contracts/:id            # 계약 상세
PATCH  /api/v1/contracts/:id            # 계약 수정
DELETE /api/v1/contracts/:id            # 계약 삭제

# 상태 변경
PATCH  /api/v1/contracts/:id/status     # 상태 변경
       { "status": "terminated" }

# 갱신
POST   /api/v1/contracts/:id/renew      # 계약 갱신

# 대시보드
GET    /api/v1/contracts/dashboard      # 계약 현황 대시보드
GET    /api/v1/contracts/expiring       # 만료 예정 계약
       ?days=30

# 히스토리
GET    /api/v1/contracts/:id/history    # 변경 이력
```

### 5.5 File API

```
POST   /api/v1/files/upload             # 파일 업로드
GET    /api/v1/files/:id                # 파일 다운로드
DELETE /api/v1/files/:id                # 파일 삭제
```

### 5.6 Dashboard API

```
GET    /api/v1/dashboard/summary        # 전체 요약
GET    /api/v1/dashboard/tasks/stats    # Task 통계
GET    /api/v1/dashboard/meetings/recent # 최근 회의록
GET    /api/v1/dashboard/contracts/expiring # 만료 예정 계약
```

---

## 6. 권한 및 보안

### 6.1 역할 정의

```typescript
enum UserRole {
  OWNER = 'owner',     // 소유자 (전체 권한)
  ADMIN = 'admin',     // 관리자 (대부분 권한)
  EDITOR = 'editor',   // 편집자 (생성/수정)
  ANALYST = 'analyst', // 분석가 (조회/생성)
  VIEWER = 'viewer',   // 뷰어 (조회만)
}
```

### 6.2 역할별 접근 권한

| 기능 | Owner | Admin | Editor | Analyst | Viewer |
|------|:-----:|:-----:|:------:|:-------:|:------:|
| **Task** |
| Task 조회 | O | O | O | O | O |
| Task 생성 | O | O | O | O | X |
| Task 수정 (본인) | O | O | O | O | X |
| Task 수정 (타인) | O | O | O | X | X |
| Task 삭제 | O | O | X | X | X |
| **Meeting** |
| 회의록 조회 | O | O | O | O | O |
| 회의록 생성 | O | O | O | O | X |
| 회의록 수정 (본인) | O | O | O | O | X |
| 회의록 발행 | O | O | O | X | X |
| 회의록 삭제 | O | O | X | X | X |
| **Contract** |
| 계약 목록 조회 | O | O | O | X | X |
| 계약 상세 조회 | O | O | O | X | X |
| 계약 금액 보기 | O | O | X | X | X |
| 계약 생성 | O | O | X | X | X |
| 계약 수정 | O | O | X | X | X |
| 계약 삭제 | O | X | X | X | X |

### 6.3 보안 고려사항

#### 6.3.1 데이터 보호

| 항목 | 방법 | 설명 |
|------|------|------|
| 계약 금액 | AES-256-GCM 암호화 | 환경변수 `CONTRACT_ENCRYPTION_KEY` |
| 비밀번호 | bcrypt 해싱 | salt rounds: 12 |
| JWT | RS256 또는 HS256 | 환경변수 `JWT_SECRET` |
| 파일 업로드 | 바이러스 스캔 | ClamAV (선택) |
| 파일 타입 | 화이트리스트 | pdf, docx, xlsx, png, jpg, txt |
| 파일 크기 | 제한 | 최대 10MB |

#### 6.3.2 접근 제어

- **Row-Level Security**: 모든 데이터 `tenant_id`로 격리
- **역할 기반 접근**: RBAC (Role-Based Access Control)
- **계약 접근 제한**: Editor 이상만 계약 정보 접근

#### 6.3.3 감사 로그

모든 민감한 작업에 대해 감사 로그 기록:
- 생성/수정/삭제 작업
- 계약 조회 (민감 정보 접근 추적)
- 로그인/로그아웃
- 파일 다운로드

---

## 7. 개발 우선순위

### 7.1 Phase 1 (MVP) - 2주

**목표**: 핵심 CRUD 및 기본 UI

| 기능 | 담당 | 예상 공수 |
|------|------|----------|
| Auth 모듈 (JWT, RBAC) | Backend | 2일 |
| User 엔티티/API | Backend | 1일 |
| Task 엔티티/API | Backend | 2일 |
| Task 기본 UI (목록/생성/수정) | Frontend | 2일 |
| Meeting 엔티티/API | Backend | 2일 |
| Meeting 기본 UI | Frontend | 2일 |
| Contract 엔티티/API (암호화 포함) | Backend | 3일 |
| Contract 기본 UI | Frontend | 2일 |
| 권한 적용 | Backend | 1일 |
| 감사 로그 연동 | Backend | 1일 |

**마일스톤**:
- 기본 CRUD 동작
- 역할별 권한 적용
- 계약 금액 암호화 동작

### 7.2 Phase 2 - 2주

**목표**: UX 개선 및 편의 기능

| 기능 | 담당 | 예상 공수 |
|------|------|----------|
| Task 칸반 보드 | Frontend | 2일 |
| Task 주차별 뷰 (캘린더) | Frontend | 2일 |
| 회의록 Markdown 에디터 | Frontend | 2일 |
| Action Item → Task 연동 | Backend + Frontend | 2일 |
| 계약 만료 알림 (Cron) | Backend | 1일 |
| 파일 업로드 모듈 | Backend + Frontend | 2일 |
| 대시보드 | Frontend | 2일 |

**마일스톤**:
- 사용자 편의성 개선
- 모듈 간 연동 (Meeting → Task)
- 알림 기능

### 7.3 Phase 3 - 1주

**목표**: 리포팅 및 고급 기능

| 기능 | 담당 | 예상 공수 |
|------|------|----------|
| 주간 리포트 생성 | Backend | 2일 |
| 회의록 PDF 내보내기 | Backend | 1일 |
| 계약 대시보드 (차트) | Frontend | 2일 |
| 전문 검색 (회의록) | Backend | 1일 |
| Sub-Task | Backend + Frontend | 2일 |

**마일스톤**:
- 리포팅 기능
- 분석/통계 기능

---

## 8. 참고 사항

### 8.1 CTEM 코드 재사용

다음 CTEM 모듈/패턴을 참고하여 개발:

| 기능 | CTEM 참조 |
|------|-----------|
| 인증/JWT | `modules/auth/` |
| 감사 로그 | `modules/audit/` |
| 파일 업로드 | (신규 구현, CTEM 패턴 참고) |
| 엔티티 구조 | `modules/*/entities/` |
| DTO 검증 | `modules/*/dto/` |
| 서비스 패턴 | `modules/*/services/` |

### 8.2 포트 할당

| 서비스 | CTEM | MsspBizCenter |
|--------|------|---------------|
| Frontend | 3000 | 3001 |
| Backend | 4000 | 4001 |
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6380 |

### 8.3 관련 문서

- CLAUDE.md: `/home/wynne/othaisan/MsspBizCenter/CLAUDE.md`
- CTEM 참조: `/home/wynne/othaisan/CTEM/`

---

## 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0 | 2026-02-07 | 정하윤 | 초안 작성, 캡틴 승인 |
| v1.1 | 2026-02-07 | 박서연 | Flask + React + MariaDB (미시시피 통합) |
| v1.2 | 2026-02-07 | 박서연 | 독립 플랫폼 전환, NestJS + Next.js + PostgreSQL |
