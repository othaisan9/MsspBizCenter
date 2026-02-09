# MsspBizCenter 기획 문서

> **작성일**: 2026-02-07
> **작성자**: 박서연 (PM)
> **버전**: v1.3
> **상태**: 승인됨
> **최종 수정**: 2026-02-09 - AI 어시스턴트, 제품 관리, tiptap 에디터, 디자인 시스템 반영

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
| 제품/옵션 마스터 데이터 관리 | 회계 시스템 연동 |
| AI 어시스턴트 (4 LLM 프로바이더) | 자체 LLM 학습/파인튜닝 |
| 감사 로그 | - |

### 1.4 기술 스택

```json
{
  "frontend": "Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + tiptap (Rich Text) + Recharts + @dnd-kit",
  "backend": "NestJS 10 + TypeORM 0.3.x + PostgreSQL 16 + helmet + @nestjs/throttler",
  "ai": "LlmProvider 인터페이스 (Anthropic, OpenAI, Gemini, Ollama) + SSE 스트리밍",
  "infra": "Docker Compose + Redis 7 + pnpm 9 Workspaces + Turborepo 2",
  "design": "Soft Neo-Brutalism (border-2 + hard shadow + rounded-md)",
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
| description | TEXT | X | 상세 설명 (tiptap 리치텍스트) |
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
| content | TEXT | X | 회의 내용 (tiptap 리치텍스트) |
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

### 2.4 Product (제품 관리)

#### 2.4.1 요구사항

- 제품(Product) 마스터 데이터 관리
- 제품별 옵션(ProductOption) 관리
- 계약과 제품 연결 (ContractProduct)
- 파생제품 유형 프리셋 지원

#### 2.4.2 주요 필드

**Product (제품)**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| tenantId | UUID | O | 테넌트 ID |
| code | VARCHAR(50) | O | 제품 코드 (테넌트별 유니크) |
| name | VARCHAR(255) | O | 제품명 |
| description | TEXT | X | 설명 |
| status | ENUM | O | active/inactive |
| vendor | VARCHAR(255) | X | 벤더명 |
| displayOrder | INT | X | 표시 순서 |

**ProductOption (제품 옵션)**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | UUID | O | PK |
| tenantId | UUID | O | 테넌트 ID |
| productId | UUID | O | 제품 FK |
| code | VARCHAR(50) | O | 옵션 코드 |
| name | VARCHAR(255) | O | 옵션명 |
| type | VARCHAR(50) | X | 파생제품 유형 (사용자 정의) |
| description | TEXT | X | 설명 |
| isActive | BOOLEAN | O | 활성 상태 |
| displayOrder | INT | X | 표시 순서 |

**파생제품 유형 프리셋**: 플랫폼, 서비스, 리포트, API, 컨설팅, 라이선스, 기타

#### 2.4.3 기능 목록

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| Product CRUD | 제품 생성/조회/수정/삭제 | P0 |
| ProductOption CRUD | 옵션 생성/조회/수정/삭제 | P0 |
| 계약 연결 | 계약에 제품/옵션 연결 | P0 |
| 접근 제어 | Admin+ 생성/수정, Owner 삭제 | P0 |

---

### 2.5 AI (AI 어시스턴트)

#### 2.5.1 요구사항

- 다중 LLM 프로바이더 지원 (Anthropic, OpenAI, Gemini, Ollama)
- 업무 컨텍스트 기반 AI 생성 (업무 설명, 회의 템플릿, 요약 등)
- SSE 스트리밍 응답 (성과 분석, 주간 리포트, 채팅)
- 테넌트별 AI 설정 관리 (API 키 암호화 저장)

#### 2.5.2 LLM 프로바이더

```typescript
interface LlmProvider {
  generate(prompt: string, options?: LlmOptions): Promise<string>;
  stream(prompt: string, options?: LlmOptions): AsyncGenerator<string>;
  listModels(apiKey?: string): Promise<LlmModel[]>;
}
```

| 프로바이더 | 설명 | 모델 조회 |
|-----------|------|-----------|
| Anthropic | Claude 시리즈 | `client.models.list()` |
| OpenAI | GPT 시리즈 (chat 모델 필터) | `client.models.list()` |
| Gemini | Google Gemini (generateContent 지원만) | `client.models.list()` |
| Ollama | 로컬 자체 호스팅 모델 | `client.list()` |

#### 2.5.3 AI 설정 (테넌트별)

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| provider | VARCHAR(20) | O | LLM 프로바이더 (기본: anthropic) |
| apiKeyEncrypted | TEXT | X | 암호화된 API 키 |
| defaultModel | VARCHAR(100) | O | 기본 모델 |
| fastModel | VARCHAR(100) | O | 빠른 모델 |
| isEnabled | BOOLEAN | O | 활성 여부 |
| monthlyBudgetLimit | DECIMAL | X | 월 예산 한도 |
| ollamaBaseUrl | VARCHAR(255) | X | Ollama 서버 URL |

#### 2.5.4 기능 목록

| 기능 | 설명 | 우선순위 | 응답 방식 |
|------|------|----------|-----------|
| 모델 목록 | 프로바이더별 사용 가능 모델 조회 | P0 | JSON |
| 업무 설명 생성 | 제목/태그/우선순위로 업무 설명 생성 | P0 | JSON |
| 회의 템플릿 | 회의 유형별 템플릿 생성 | P0 | JSON |
| 회의 요약 | 회의록 내용 자동 요약 | P0 | JSON |
| 성과 분석 | 사용자 업무 성과 분석 | P1 | SSE |
| 주간 리포트 | 주차별 업무 리포트 생성 | P1 | SSE |
| 액션 아이템 추출 | 회의록에서 후속 조치 추출 | P1 | JSON |
| AI 채팅 | 컨텍스트 기반 자유 대화 | P1 | SSE |
| AI 설정 관리 | 프로바이더/모델/예산 설정 | P0 | JSON |

---

## 3. 기술 스택 상세

### 3.1 Frontend

| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | Next.js | 15.x | App Router, SSR |
| UI Library | React | 19.x | UI 컴포넌트 |
| Language | TypeScript | 5.7+ | 타입 안정성 |
| Styling | Tailwind CSS | 3.4+ | 유틸리티 CSS + Soft Neo-Brutalism |
| Rich Text | tiptap | 3.x | 리치텍스트 에디터/뷰어 |
| State | SWR | 2.x | 서버 상태 관리 |
| Icons | Iconoir | 7.x | SVG 아이콘 |
| Charts | Recharts | 2.x | 데이터 시각화 (Donut, Bar, Area) |
| DnD | @dnd-kit | 6.x+ | 칸반 드래그앤드롭 |
| Toast | sonner | - | 토스트 알림 |
| Sanitize | isomorphic-dompurify | - | XSS 방지 |
| Testing | Vitest + Playwright | 2.x + 1.x | Unit + E2E |

### 3.2 Backend

| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | NestJS | 10.x | REST API |
| ORM | TypeORM | 0.3.x | DB 접근 |
| Database | PostgreSQL | 16+ | 메인 DB |
| Cache | Redis | 7.x | 캐시, 세션 |
| Validation | class-validator | 0.14+ | DTO 검증 |
| Auth | Passport + JWT (HS256) | - | 인증 |
| Security | helmet + @nestjs/throttler | - | 보안 헤더, Rate Limiting |
| File Upload | Multer | - | 파일 업로드 (10MB, MIME 화이트리스트) |
| AI | @anthropic-ai/sdk, openai, @google/genai | - | LLM 프로바이더 |
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

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    products     │     │ product_options │     │contract_products│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ tenant_id (FK)  │◄────┤ product_id (FK) │     │ tenant_id (FK)  │
│ code            │     │ tenant_id (FK)  │     │ contract_id(FK) │──► contracts
│ name            │     │ code            │     │ product_id (FK) │──► products
│ description     │     │ name            │     │ product_option  │──► product_options
│ status          │     │ type            │     │ quantity        │
│ vendor          │     │ description     │     │ notes           │
│ display_order   │     │ is_active       │     │ created_at      │
│ created_at      │     │ display_order   │     │ updated_at      │
│ updated_at      │     │ created_at      │     └─────────────────┘
└─────────────────┘     │ updated_at      │
                        └─────────────────┘

┌─────────────────┐
│   ai_settings   │
├─────────────────┤
│ id (PK)         │
│ tenant_id (UK)  │
│ provider        │
│ api_key_encrypt │
│ default_model   │
│ fast_model      │
│ is_enabled      │
│ monthly_budget  │
│ ollama_base_url │
│ created_at      │
│ updated_at      │
└─────────────────┘
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

-- Product 인덱스
CREATE UNIQUE INDEX idx_products_tenant_code ON products(tenant_id, code);
CREATE INDEX idx_products_tenant_status ON products(tenant_id, status);
CREATE INDEX idx_product_options_tenant_product ON product_options(tenant_id, product_id);
CREATE INDEX idx_contract_products_tenant_contract ON contract_products(tenant_id, contract_id);

-- AI Settings 인덱스
CREATE UNIQUE INDEX idx_ai_settings_tenant ON ai_settings(tenant_id);
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

### 5.6 Product API

```
# 제품 CRUD
GET    /api/v1/products                  # 제품 목록 (옵션 포함)
POST   /api/v1/products                  # 제품 생성 (Admin+)
GET    /api/v1/products/:id              # 제품 상세
PATCH  /api/v1/products/:id              # 제품 수정 (Admin+)
DELETE /api/v1/products/:id              # 제품 삭제 (Owner)

# 제품 옵션
POST   /api/v1/products/:id/options              # 옵션 추가 (Admin+)
PATCH  /api/v1/products/:id/options/:optionId    # 옵션 수정 (Admin+)
DELETE /api/v1/products/:id/options/:optionId    # 옵션 삭제 (Admin+)
```

### 5.7 User API

```
# 사용자 CRUD
GET    /api/v1/users                     # 사용자 목록
POST   /api/v1/users                     # 사용자 추가 (Admin+)
PATCH  /api/v1/users/:id                 # 사용자 수정 (Admin+)
DELETE /api/v1/users/:id                 # 사용자 삭제 (Owner)
```

### 5.8 AI API

```
# AI 생성
POST   /api/v1/ai/models                # 프로바이더별 모델 목록 (Admin+)
POST   /api/v1/ai/generate-task-desc     # 업무 설명 생성
POST   /api/v1/ai/generate-meeting-template  # 회의 템플릿 생성
POST   /api/v1/ai/summarize-meeting      # 회의 요약
POST   /api/v1/ai/extract-actions        # 액션 아이템 추출

# AI 스트리밍 (SSE)
POST   /api/v1/ai/my-performance         # 성과 분석 (SSE)
POST   /api/v1/ai/weekly-report          # 주간 리포트 (SSE, Analyst+)
POST   /api/v1/ai/chat                   # AI 채팅 (SSE)

# AI 설정
GET    /api/v1/ai/settings               # AI 설정 조회 (Admin+)
PATCH  /api/v1/ai/settings               # AI 설정 수정 (Admin+)
```

### 5.9 Stats API (Dashboard)

```
GET    /api/v1/stats/dashboard           # 대시보드 전체 통계
GET    /api/v1/stats/tasks/weekly        # 주차별 업무 통계 (12주)
GET    /api/v1/stats/contracts/monthly   # 월별 계약 통계 (12개월)
GET    /api/v1/stats/tasks/by-status     # 상태별 업무 비율
GET    /api/v1/stats/tasks/by-priority   # 우선순위별 업무 비율
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
| JWT | HS256 | 환경변수 `JWT_SECRET` |
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

### 7.1 Phase 1 (MVP) - 완료 (v0.1.0-alpha.4)

**목표**: 핵심 CRUD 및 기본 UI - **완료**

- Auth 모듈 (JWT HS256, RBAC 5역할)
- Task/Meeting/Contract 엔티티 + API + Frontend
- 계약 금액 AES-256-GCM 암호화
- 감사 로그 (90일 보존)
- Products 마스터 데이터 모듈

### 7.2 Phase 2 - 완료 (v0.1.0-alpha.5~8)

**목표**: UX 개선 및 편의 기능 - **완료**

- 칸반 보드 (@dnd-kit 드래그앤드롭)
- tiptap 리치텍스트 에디터 (Markdown 대체)
- 대시보드 차트 4종 (Recharts)
- Stats API 5개 엔드포인트
- 파일 업로드 (Multer, 10MB, MIME 화이트리스트)
- Docker 핫리로드 개발 환경
- 토스트 알림 (sonner)
- 사용자 추가 API + 모달
- 페이지네이션 통일
- Soft Neo-Brutalism 디자인 시스템 (25파일)
- 보안 강화 (helmet, throttler, SQL Injection 방어)

### 7.3 Phase 3 - 완료 (v0.1.0-alpha.9~10)

**목표**: AI, 타입 안전성, 품질 - **완료**

- AI 어시스턴트 모듈 (4 LLM 프로바이더, 7 엔드포인트, SSE)
- 제품 구조 재설계 (productType 제거 → ProductOption.type)
- tiptap 리치텍스트 에디터 (3모듈 6페이지)
- P1 타입 안전성 리팩토링 (Backend any 34→2, Frontend any 48→0)
- Shared DTO 통합 (25+ 인터페이스)
- XSS 보안 수정 (DOMPurify 화이트리스트)

### 7.4 Phase 4 - 진행 예정

**목표**: 안정화 및 프로덕션 준비

| 기능 | 담당 | 상태 |
|------|------|------|
| 공통 컴포넌트 추출 (Pagination, Table) | Frontend | 미착수 |
| SWR 데이터 fetching 표준화 | Frontend | 미착수 |
| Redis 캐싱 (Dashboard Stats, Products) | Backend | 미착수 |
| localStorage → HttpOnly Cookie + CSRF | Security + Backend | 미착수 |
| Backend Unit Test 60% 커버리지 | Backend | 미착수 |
| 프로덕션 Docker Compose | DevOps | 미착수 |
| CI/CD 파이프라인 | DevOps | 미착수 |
| E2E 테스트 (Playwright) | QA | 미착수 |

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
| v1.3 | 2026-02-09 | 문서인 | AI 어시스턴트, 제품 관리, tiptap, 디자인 시스템, Phase 현행화 |
