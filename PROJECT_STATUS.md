# MsspBizCenter 프로젝트 상태

**마지막 업데이트**: 2026-02-09
**현재 버전**: v0.1.0-alpha.10
**개발 브랜치**: `master` (main 브랜치로 PR 예정)

---

## 참조 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 개발 가이드, 아키텍처, 코드 컨벤션 |
| [CHANGELOG.md](./CHANGELOG.md) | 전체 변경 이력 (아카이브) |
| [VERSION](./VERSION) | 현재 버전 (단일 소스) |
| [infra/docker/README.md](./infra/docker/README.md) | Docker 개발 환경 가이드 |
| [apps/backend/docs/stats-api.md](./apps/backend/docs/stats-api.md) | Stats API 문서 |

---

## 1. 프로젝트 개요

### 기본 정보
- **프로젝트명**: MsspBizCenter - MSSP 비즈니스 센터 (팀 업무 포털)
- **아키텍처**: Monorepo (pnpm Workspaces + Turborepo) + Docker
- **기술 스택**:
  - Backend: NestJS 10 + TypeScript + TypeORM + PostgreSQL 16 + Redis 7
  - Frontend: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
  - Infra: Docker Compose (개발), 향후 AWS ECS (프로덕션)
  - Shared: packages/shared (공유 Enum, 타입, 상수)

### 핵심 기능 (3대 모듈)
1. **Task 관리** - 주차별 업무 일지, 칸반 보드 (드래그앤드롭), 담당자 할당, 태그 프리셋
2. **Meeting 관리** - 회의록, 참석자/안건/액션아이템/결정사항, Action Item 추적
3. **Contract 관리** - 계약 정보, 재무 계산(매입/판매/마진), 만료 알림, 파일 첨부, 파트너사 관리

---

## 2. 프로젝트 디렉토리 구조

```
MsspBizCenter/
├── apps/
│   ├── backend/          # NestJS API 서버 (포트 4001)
│   │   └── src/
│   │       ├── common/           # 공통 (BaseEntity, Guards, Decorators, Filters)
│   │       └── modules/          # 기능 모듈
│   │           ├── auth/         # JWT 인증 + Passport + RBAC
│   │           ├── tasks/        # 업무 CRUD + 주차별 조회
│   │           ├── meetings/     # 회의록 CRUD + Action Items
│   │           ├── contracts/    # 계약 CRUD + AES-256-GCM 암호화 + 재무
│   │           ├── products/     # 제품/옵션 관리
│   │           ├── users/        # 사용자 CRUD + 역할 관리
│   │           ├── audit/        # 감사 로그
│   │           ├── stats/        # 대시보드 통계 API (5개 엔드포인트)
│   │           ├── files/        # 파일 업로드 (Multer, 10MB)
│   │           └── ai/           # AI 어시스턴트 (4 LLM 프로바이더, SSE 스트리밍)
│   └── frontend/         # Next.js 15 앱 (포트 3001)
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # 로그인/회원가입
│           │   └── (dashboard)/  # 인증된 사용자 페이지
│           │       ├── tasks/    # 업무 목록/생성/상세 + 칸반
│           │       ├── meetings/ # 회의록 목록/생성/상세
│           │       ├── contracts/# 계약 목록/생성/상세
│           │       └── settings/ # 설정 (마스터데이터/재무관리/사용자관리/파트너사)
│           ├── components/
│           │   ├── ui/           # Button, Input, Select, Badge, Modal, Card, FileUpload, FileList, Breadcrumb, MarkdownEditor, MarkdownViewer
│           │   ├── layout/       # Sidebar (알림 뱃지), Header
│           │   ├── charts/       # WeeklyTask, TaskStatus, TaskPriority, MonthlyContract
│           │   ├── tasks/        # KanbanBoard, KanbanColumn, KanbanCard
│           │   └── settings/     # AiTab, MasterDataTab, FinanceTab, UsersTab, PartnersTab
│           └── lib/              # API Client, Auth Context, Utils
├── packages/
│   └── shared/           # 공유 타입/Enum/상수 (PaymentCycle, CommissionType 등)
├── mockup/               # HTML 프로토타입 (9개 파일)
├── infra/
│   └── docker/           # Docker Compose 개발 환경 (핫리로드)
├── docs/                 # 프로젝트 문서
├── CLAUDE.md             # 개발 가이드 (Claude Code용)
├── VERSION               # 버전 관리 (단일 소스)
├── turbo.json            # Turborepo 설정
├── pnpm-workspace.yaml   # 워크스페이스 설정
└── package.json          # 루트 워크스페이스
```

---

## 3. 최근 변경사항

### v0.1.0-alpha.10 - AI 어시스턴트 모듈 + 제품 재설계 + QA (2026-02-08~09)

**담당**: PM 박서연 + 박안도(Backend) + 유아이(Frontend) + 나검수(QA)

#### 📋 주요 작업

**1. AI 어시스턴트 모듈 (박안도)**
- LlmProvider 인터페이스 설계: `generate()`, `stream()`, `listModels()` 3대 메서드
- 4개 프로바이더 구현: Anthropic, OpenAI, Gemini (`@google/genai`), Ollama
- `listModels()`: 각 프로바이더 API를 통한 동적 모델 목록 조회
  - Anthropic: `client.models.list()`
  - OpenAI: `client.models.list()` (chat 모델 필터)
  - Gemini: `client.models.list()` (generateContent 지원 모델만)
  - Ollama: `client.list()` (로컬 모델)
- AI 엔드포인트 7개: models, generate-task-desc, generate-meeting-template, summarize-meeting, my-performance, weekly-report, extract-actions, chat
- `POST /ai/models`: 프로바이더/API키를 body로 받아 DB 저장 전에도 모델 조회 가능
- SSE 스트리밍 (my-performance, weekly-report, chat)
- PromptBuilder 서비스: 한국어 MSSP 컨텍스트 프롬프트

**2. 제품 구조 재설계 (박안도)**
- Product에서 productType 제거 → ProductOption에 `type` (사용자 정의 문자열) 추가
- 파생제품 유형 프리셋: 플랫폼, 서비스, 리포트, API, 컨설팅, 라이선스, 기타

**3. 계약-제품 관계 수정 (박안도)**
- `Contract ↔ ContractProduct` OneToMany 관계 추가
- `CreateContractDto`에 `products` 필드 추가 (ContractProductItemDto[])
- `contracts.service.ts`: create/update에서 ContractProduct 레코드 생성/갱신
- `contracts.service.ts findOne()`: contractProducts relations 추가

**4. 프론트엔드 QA 수정 (유아이)**
- `contracts/new/page.tsx`: `product?.productOptions` → `product?.options` (필드명 수정)
- 대시보드 만료임박 카드: `bg-red-50 border-red-700` → `bg-white border-gray-800` (통일)
- 설정 페이지 컴포넌트 분리: AiTab, MasterDataTab, FinanceTab, UsersTab, PartnersTab, types
- AI 설정 탭: 하드코딩 모델 제거 → 동적 모델 조회 (모델 목록 불러오기 버튼)
- `isomorphic-dompurify` SSR 에러 수정 (lazy require)
- `api.ts` 전면 리팩토링: shared 타입 import + any 제거

**5. XSS 보안 수정 (나검수)**
- `sanitizeHtml()` DOMPurify 화이트리스트 적용 (ALLOWED_TAGS/ATTR)
- HTTP Exception Filter 강화
- `jwt-auth.guard.ts` 토큰 검증 강화

**6. P1 타입 안전성 리팩토링 (박안도 + 유아이 + 나검수)**

- **T6. Backend `any` 제거** (34개소 → 2개 잔여)
  - 11개 파일에서 `any` → 구체적 타입 변환
  - `http-exception.filter.ts`: `any[]` → `string[]`, `any` → `Record<string, unknown>`
  - `audit.service.ts`: `any` → `unknown` (timeline changes)
  - `prompt-builder.service.ts`: `any[]` → 구체적 task/contextData 타입
  - `ai.service.ts`: `any` → `Record<string, unknown>`, 반환 타입 명시
  - `task.entity.ts`: `attachments: any` → `Record<string, unknown>[] | null`
  - `contracts.service.ts`: `Record<string, unknown>` → `Contract & { amount?: number; ... }`
  - `users.service.ts`: where 조건 `any` → `Record<string, unknown>`
  - TS1272 fix: 3개 Controller에서 `import type { RequestUser }` 분리 (isolatedModules 대응)
  - `RequestUser.role`을 `string` → `UserRole` enum으로 강화 (shared 패키지)
  - 잔여 `any` 2건: `jwt-auth.guard.ts` handleRequest (Passport 제약), Recharts 콜백 (라이브러리 타입 한계)

- **T7. Frontend API 타입 강화** (48개 함수)
  - `api.ts` 전면 재작성: 48개 함수 모두 shared 타입 반환
  - `QueryParams = Record<string, string | number | boolean>` 도입 + `toSearchParams()` 헬퍼
  - 차트 4개 컴포넌트 데이터 매핑 추가 (API 응답 `{ year, month(number) }` → 차트 `{ month(string) }`)
  - **실제 버그 발견**: 대시보드 필드명 오류 (`completedTasksThisWeek` → `completedThisWeek`, `meetingsThisMonth` → `totalMeetings`) - `any` 타입에 의해 숨겨져 있던 런타임 버그

- **T9. Shared DTO 통합** (25+ 인터페이스)
  - `packages/shared/src/types/api-responses.ts` 신규 생성 (340줄)
  - 10개 도메인 25+ 인터페이스: TaskResponse, MeetingResponse, ContractResponse, ProductResponse, FileResponse, UserResponse, DashboardStatsResponse, WeeklyTaskStatsResponse, MonthlyContractStatsResponse, TasksByStatusResponse, TasksByPriorityResponse, ContractDashboardResponse, ContractHistoryResponse, AiSettingsResponse 등
  - 프론트엔드 10+ 파일에서 로컬 인터페이스 → `type X = XResponse` 별칭 교체
  - `settings/types.ts`: Product, User → shared 타입 별칭
  - `null` vs `undefined` 불일치 전면 정리 (백엔드 `| null` 기준으로 통일)

- **QA 검수 (나검수)**: Backend 20정상/3주의/0결함, Frontend 6/6카테고리 통과/0결함
- **런타임 검증**: Docker 이미지 재빌드 + 3/3 패키지 빌드 성공 + Frontend 200 + Backend 정상 기동

#### 📁 수정/생성된 파일

**Backend** (15파일):
- `apps/backend/src/modules/ai/` - AI 모듈 전체 (controller, service, dto, providers×4, prompt-builder)
- `apps/backend/src/modules/contracts/entities/contract.entity.ts` - ContractProduct OneToMany
- `apps/backend/src/modules/contracts/contracts.service.ts` - products 처리
- `apps/backend/src/modules/contracts/contracts.module.ts` - ContractProduct 등록
- `apps/backend/src/modules/contracts/dto/create-contract.dto.ts` - products 필드
- `apps/backend/src/common/filters/http-exception.filter.ts` - 응답 강화

**Frontend** (15파일):
- `apps/frontend/src/components/settings/` - 5개 탭 컴포넌트 (신규)
- `apps/frontend/src/app/(dashboard)/settings/page.tsx` - 컴포넌트 분리
- `apps/frontend/src/app/(dashboard)/page.tsx` - 만료임박 카드 스타일 통일
- `apps/frontend/src/app/(dashboard)/contracts/new/page.tsx` - productOptions→options
- `apps/frontend/src/lib/api.ts` - 타입 리팩토링 + aiApi POST models
- `apps/frontend/src/lib/utils.ts` - sanitizeHtml DOMPurify lazy require

**Shared** (2파일):
- `packages/shared/src/types/index.ts` - RequestUser.role `string` → `UserRole`, `api-responses` re-export
- `packages/shared/src/types/api-responses.ts` - API 응답 타입 정의 (신규, 340줄, 25+ 인터페이스)

**Frontend - P1 타입 리팩토링** (15파일):
- `apps/frontend/src/lib/api.ts` - 48개 함수 shared 타입 적용 + QueryParams + toSearchParams
- `apps/frontend/src/app/(dashboard)/page.tsx` - DashboardStatsResponse + 필드명 버그 수정
- `apps/frontend/src/app/(dashboard)/contracts/[id]/page.tsx` - ContractResponse/HistoryResponse/FileResponse 별칭
- `apps/frontend/src/app/(dashboard)/contracts/page.tsx` - ContractResponse + ContractDashboardResponse
- `apps/frontend/src/app/(dashboard)/tasks/[id]/page.tsx` - TaskResponse + TaskStatus enum
- `apps/frontend/src/app/(dashboard)/tasks/page.tsx` - TaskResponse 별칭
- `apps/frontend/src/app/(dashboard)/tasks/new/page.tsx` - UserResponse 별칭
- `apps/frontend/src/app/(dashboard)/meetings/new/page.tsx` - UserResponse 별칭
- `apps/frontend/src/components/tasks/KanbanBoard.tsx` - TaskResponse + TaskStatus
- `apps/frontend/src/components/tasks/KanbanColumn.tsx` - TaskResponse 별칭
- `apps/frontend/src/components/tasks/KanbanCard.tsx` - TaskResponse 별칭
- `apps/frontend/src/components/charts/*.tsx` (4개) - API 응답→차트 데이터 매핑, `any` 제거
- `apps/frontend/src/components/settings/types.ts` - Product/User → shared 별칭

#### 🎯 성과 지표
- Backend: 11개 모듈 (auth, tasks, meetings, contracts, products, users, audit, common, stats, files, **ai**)
- Frontend: 13개 라우트 + 4개 차트 + 칸반 + 파일 업로드 + 브레드크럼 + **AI 컴포넌트**
- AI: 4 LLM 프로바이더 + 7 엔드포인트 + SSE 스트리밍
- **타입 안전성**: Backend `any` 34→2개, Frontend API `any` 48→0개, Shared DTO 25+ 인터페이스
- 빌드: 3/3 패키지 성공

---

### v0.1.0-alpha.9 - tiptap 리치텍스트 에디터 적용 (2026-02-08)

**담당**: PM 박서연 + 유아이(Frontend) + 송대시(Visualization)

#### 📋 주요 작업

**1. tiptap 에디터 컴포넌트 구축** (유아이)
- `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link` + `@tiptap/extension-placeholder` + `@tiptap/pm` (v3.19.0) 설치
- `MarkdownEditor.tsx` (210줄) — 리치텍스트 에디터 (9버튼 툴바: B/I/H2/H3/•/1./>/\<\>/Link)
- `MarkdownViewer.tsx` (53줄) — 읽기 전용 뷰어 (editable:false, prose 클래스)
- Neo-Brutalism 디자인: border-2 border-gray-800, shadow-brutal-sm, hover:-translate-y-0.5, active 토글(primary-600)

**2. prose Neo-Brutalism 타이포그래피** (송대시)
- `tailwind.config.ts` typography.DEFAULT.css 커스텀
- 인라인 코드: 2px border, gray-100 bg, rounded
- 코드 블록: 2px border, dark bg, brutal-sm shadow
- 블록인용: 4px left border primary-600, blue-50 bg
- 테이블: 2px borders, bold headers
- 링크: primary-600, semibold
- 이미지: 2px border, brutal-sm shadow

**3. 3개 모듈 에디터 적용** (유아이)

| 모듈 | 생성(new) | 상세([id]) |
|------|-----------|-----------|
| Meeting | `content` → MarkdownEditor | `content` → MarkdownViewer |
| Task | `description` → MarkdownEditor | 표시 → MarkdownViewer, 수정 모달 → MarkdownEditor |
| Contract | `description` + `memo` → MarkdownEditor ×2 | `description` + `memo` → MarkdownViewer ×2 |

**4. 보안 검증**
- ProseMirror 스키마 기반 화이트리스트 → script/iframe/img-onerror 자동 제거
- 별도 DOMPurify 불필요 (StarterKit + Link 스키마만 허용)
- 빌드: 13/13 페이지 정상 컴파일

#### 📁 수정/생성된 파일

**Frontend** (9파일):
- `apps/frontend/src/components/ui/MarkdownEditor.tsx` — 신규 (tiptap 에디터)
- `apps/frontend/src/components/ui/MarkdownViewer.tsx` — 신규 (tiptap 뷰어)
- `apps/frontend/tailwind.config.ts` — prose typography Neo-Brutalism
- `apps/frontend/src/app/(dashboard)/meetings/new/page.tsx` — content → MarkdownEditor
- `apps/frontend/src/app/(dashboard)/meetings/[id]/page.tsx` — content → MarkdownViewer
- `apps/frontend/src/app/(dashboard)/tasks/new/page.tsx` — description → MarkdownEditor
- `apps/frontend/src/app/(dashboard)/tasks/[id]/page.tsx` — description → MarkdownViewer + 수정 모달 MarkdownEditor
- `apps/frontend/src/app/(dashboard)/contracts/new/page.tsx` — description + memo → MarkdownEditor ×2
- `apps/frontend/src/app/(dashboard)/contracts/[id]/page.tsx` — description + memo → MarkdownViewer ×2

**버전 동기화** (5파일):
- `VERSION`, `package.json` ×4, `Sidebar.tsx`

---

### v0.1.0-alpha.8 - 태그 삭제 + 사용자 추가 + 페이지네이션 통일 (2026-02-08)

**담당**: PM 박서연 + 박안도(Backend) + 유아이(Frontend) + 나검수(QA)

#### 📋 주요 작업

**1. 태그 삭제 UI** (유아이)
- Task 상세 페이지: 태그 옆 X 버튼 + 삭제 시 API 호출 (`tasksApi.update`)
- Task 수정 모드: 태그 편집 시 X 버튼으로 개별 삭제
- Kanban 카드: 태그 표시 + 담당자 필터 드롭다운 추가
- `tailwind.config.ts`: Iconoir 아이콘 패키지 추가

**2. 사용자 추가 (풀스택)** (박안도 + 유아이)
- Backend: `POST /api/v1/users` - CreateUserDto (email/name/password/role), bcrypt 해싱, RBAC 검증
- Frontend: Settings > 사용자 탭에 "팀원 추가" 버튼 + 모달 (이메일/이름/임시비밀번호/역할)
- 이메일 중복 체크, OWNER 역할 부여 차단, ADMIN 역할은 OWNER만 부여 가능

**3. 페이지네이션 UI 통일** (유아이)
- Tasks/Meetings/Contracts 3개 페이지 페이지네이션 패턴 통일
- "전체 N개 중 X-Y개 표시" + 이전/페이지번호/다음 버튼
- `border-t-2 border-gray-800` 구분선, `primary`/`ghost` 버튼 변형

**4. Backend 수정** (박안도)
- `tasks.service.ts`: `perPage` → `limit` 파라미터명 통일
- `main.ts`: Swagger 버전 동기화

**5. QA 검수 (병렬 에이전트 2대)** (나검수)

| QA 영역 | 점수 | 발견 이슈 |
|---------|------|----------|
| Frontend 코드 품질 | 95/100 | 0 blocking, 2 권고 |
| Backend 코드 품질 | 96.7% (29/30) | 1 Medium (JWT Payload 주석) |

- Frontend 권고: Kanban Task 인터페이스 통일, Pagination 공통 컴포넌트 추출
- Backend 권고: JWT Payload 주석 개선 (`sub: string; // userId` → `// user ID`)

#### 📁 수정/생성된 파일

**Backend** (4파일):
- `apps/backend/src/modules/users/dto/create-user.dto.ts` - 신규 (사용자 생성 DTO)
- `apps/backend/src/modules/users/users.controller.ts` - POST /users 엔드포인트 추가
- `apps/backend/src/modules/users/users.service.ts` - create() 메서드 추가
- `apps/backend/src/modules/tasks/tasks.service.ts` - perPage → limit

**Frontend** (10파일):
- `apps/frontend/src/app/(dashboard)/tasks/[id]/page.tsx` - 태그 삭제 X 버튼
- `apps/frontend/src/app/(dashboard)/tasks/page.tsx` - 칸반 담당자 필터
- `apps/frontend/src/app/(dashboard)/meetings/page.tsx` - 페이지네이션 통일
- `apps/frontend/src/app/(dashboard)/contracts/page.tsx` - 페이지네이션 통일
- `apps/frontend/src/app/(dashboard)/settings/page.tsx` - 팀원 추가 모달
- `apps/frontend/src/components/tasks/KanbanBoard.tsx` - tags 전달
- `apps/frontend/src/components/tasks/KanbanCard.tsx` - 태그 표시 UI
- `apps/frontend/src/lib/api.ts` - usersApi.create() 추가
- `apps/frontend/tailwind.config.ts` - Iconoir 패키지 설정
- `apps/frontend/src/components/layout/Sidebar.tsx` - 버전 v0.1.0-alpha.8

**QA 보고서** (2파일):
- `tests/qa-reports/frontend-code-review-20260208.md` - 프론트엔드 검수 보고서
- `tests/qa-reports/backend-code-review-20260208.md` - 백엔드 검수 보고서

---

### v0.1.0-alpha.7 - P1+P2 보안 강화 + 프론트 품질 개선 (2026-02-08)

**담당**: PM 박서연 + 박안도(Backend) + 유아이(Frontend) + Chloe(Security) + 송대시(Charts)

#### 📋 주요 작업

**1. 보안 강화** (Chloe + 박안도)
- `@nestjs/throttler` Rate Limiting 추가 (전역 60req/min)
- `helmet` 보안 헤더 적용
- Auth 로그인 Rate Limit 강화 (5req/60s)
- FilesController에 RolesGuard 추가
- Stats Service N+1 쿼리 최적화 (relation → queryBuilder)

**2. Frontend 품질 개선** (유아이)
- Toast 전역 통일 (모든 API 에러에 toast.error 적용)
- useEffect/useCallback 무한루프 위험 패턴 제거
- EmptyState 공통 컴포넌트 추출
- Skeleton 로딩 UI 컴포넌트 추출
- 대시보드 차트 에러 핸들링 강화

**3. 차트 개선** (송대시)
- TaskStatusChart: Pie → Donut 전환 + 중앙 라벨
- TaskPriorityChart: Pie → 수평 Bar 전환 + 접근성(색맹) 패턴
- 전체 차트 Neo-Brutalism 스타일 통일 (border-2, shadow-brutal)

**4. CLAUDE.md 최적화**
- 343줄 → 75줄 (78% 감소)
- 반복 내용을 Skill 명령으로 이동 (/버전업, /개발환경, /프론트가이드)

#### 📁 수정/생성된 파일

**Backend** (7파일):
- `apps/backend/src/app.module.ts` - ThrottlerModule 추가
- `apps/backend/src/main.ts` - helmet() 적용
- `apps/backend/src/modules/auth/auth.controller.ts` - @Throttle(5, 60)
- `apps/backend/src/modules/files/files.controller.ts` - RolesGuard 추가
- `apps/backend/src/modules/files/files.module.ts` - AuthModule import
- `apps/backend/src/modules/stats/stats.service.ts` - N+1 쿼리 최적화
- `apps/backend/package.json` - helmet, @nestjs/throttler 의존성

**Frontend** (10파일):
- 차트 4종: MonthlyContractChart, TaskPriorityChart, TaskStatusChart, WeeklyTaskChart
- `apps/frontend/src/components/ui/EmptyState.tsx` - 신규
- `apps/frontend/src/components/ui/Skeleton.tsx` - 신규
- `apps/frontend/src/app/(dashboard)/page.tsx` - 대시보드 차트 에러 핸들링
- `apps/frontend/src/app/(dashboard)/tasks/page.tsx` - Toast 통일
- `apps/frontend/src/app/(dashboard)/contracts/page.tsx` - Toast 통일
- `apps/frontend/src/app/(dashboard)/meetings/page.tsx` - Toast 통일

---

### v0.1.0-alpha.6 - 목업 GAP 분석 + CRITICAL/HIGH/MEDIUM 구현 + QA (2026-02-08)

**담당**: PM 박서연 + 박안도(Backend) + 유아이(Frontend) + Chloe(Security) + 나검수(QA)

#### 📋 주요 작업

**1. 목업 vs 구현 GAP 분석** (병렬 에이전트 3대)
- 9개 HTML 목업 ↔ 현재 Frontend/Backend 비교 분석
- CRITICAL 5건, HIGH 4건, MEDIUM 2건 식별 → 전량 구현 완료

**2. CRITICAL 구현 (5건)**
- **계약 재무 필드 확장** (박안도): paymentCycle, VAT, purchasePrice/sellingPrice 암호화, 파트너/수수료, 담당자, 메모, 알림 설정
- **Users CRUD 모듈** (박안도): GET/PATCH/DELETE + RBAC (OWNER/ADMIN만 역할 변경, 자기 수정 방지)
- **회의록 폼 강화** (유아이): 참석자 체크박스, 안건, 동적 액션아이템, 결정사항, 상태 라디오 카드
- **계약 생성/상세 강화** (유아이): 재무 자동계산(매입/판매/마진), 담당자 선택, 연락처, 남은기간 D-day, 메모
- **설정 탭 + 담당자** (유아이): 마스터데이터/계약재무관리/사용자관리 3탭 + Task 담당자 선택

**3. HIGH 구현 (4건)**
- **계약 요약 카드** (유아이): 전체/활성/만료임박/만료해지 4종, 클릭 필터링
- **계약 파일 첨부** (유아이): 드래그&드롭 업로드, 다운로드, 삭제 (RBAC)
- **만료 알림 뱃지** (유아이): 사이드바 뱃지(7일:빨강/30일:노랑) + 대시보드 배너
- **파트너사 관리** (유아이): 설정 > 파트너사 탭 (CRUD + 영업담당자 지정, localStorage)

**4. MEDIUM 구현 (2건)**
- **카드/테이블 뷰 전환 + 브레드크럼** (유아이): 회의록 카드/테이블 토글 + 6개 하위 페이지 브레드크럼
- **남은 기간 D-day + 태그 프리셋** (유아이): 계약 목록 D-day 컬럼(색상 코딩) + 업무 태그 프리셋 12종

**5. QA 검수 (병렬 에이전트 5대)**

| QA 영역 | 결과 | 발견 이슈 |
|---------|------|----------|
| Frontend 코드 품질 | 94% | Sidebar user 의존성 무한루프 |
| Backend 코드 품질 | 97.6% | @CurrentUser 패턴 통일 권장 |
| API-Frontend 통합 | 94.8% | Audit API 경로 불일치 |
| UI/UX 일관성 | 94% | 인라인 textarea 1건 |
| 보안 | HIGH 3건 | SQL Injection, Swagger 노출 |

**6. QA 발견 즉시 수정 (4건)**
- `contracts.service.ts`: sortBy SQL Injection 방어 (화이트리스트 검증)
- `api.ts`: Audit API 경로 `/audit/{type}/{id}` → `/audit/entity/{type}/{id}`
- `Sidebar.tsx`: `[user]` → `[user?.id]` (무한루프 방지)
- `main.ts`: Swagger 프로덕션 비활성화 (`NODE_ENV !== 'production'`)

**7. Soft Neo-Brutalism 디자인 시스템 전환** (유아이 × 4 병렬)
- **Foundation**: tailwind.config.ts (brutal shadow 6종 토큰) + globals.css (@layer base 폼 전역 오버라이드)
- **UI 컴포넌트 11종**: Card, Button, Badge, Modal, Sidebar, Breadcrumb, Input, Select, Textarea, FileUpload, FileList
- **페이지 12라우트 + 로그인**: 전체 두꺼운 테두리(2px) + 하드섀도우 + press 효과 적용
- **디자인 원칙**: 두꺼운 테두리(border-2 border-gray-800), 하드 섀도우(no blur), rounded-md, hover translate + shadow 감소, focus ring → shadow-brutal-primary
- 25개 파일, +228/-169 라인

#### 📁 수정/생성된 파일

**Backend**:
- `apps/backend/src/main.ts` - Swagger 프로덕션 비활성화, port 변수 순서 수정
- `apps/backend/src/app.module.ts` - UsersModule 등록
- `apps/backend/src/modules/users/` - 모듈 전체 (controller, service, module, DTOs)
- `apps/backend/src/modules/contracts/entities/contract.entity.ts` - 재무 필드 13개 추가
- `apps/backend/src/modules/contracts/dto/create-contract.dto.ts` - 재무 DTO 확장
- `apps/backend/src/modules/contracts/contracts.service.ts` - purchasePrice/sellingPrice 암호화 + sortBy 화이트리스트
- `packages/shared/src/enums/index.ts` - PaymentCycle, CommissionType 추가

**Frontend (기능)**:
- `apps/frontend/src/lib/api.ts` - usersApi + Audit 경로 수정
- `apps/frontend/src/components/layout/Sidebar.tsx` - 만료 알림 뱃지 + user?.id 수정
- `apps/frontend/src/components/ui/Breadcrumb.tsx` - 신규 생성
- `apps/frontend/src/app/(dashboard)/page.tsx` - 만료 알림 배너
- `apps/frontend/src/app/(dashboard)/contracts/page.tsx` - 요약 카드 4종 + D-day 컬럼
- `apps/frontend/src/app/(dashboard)/contracts/new/page.tsx` - 재무/담당자/메모/첨부안내
- `apps/frontend/src/app/(dashboard)/contracts/[id]/page.tsx` - 재무/남은기간/파일첨부
- `apps/frontend/src/app/(dashboard)/meetings/page.tsx` - 카드/테이블 뷰 전환
- `apps/frontend/src/app/(dashboard)/meetings/new/page.tsx` - 참석자/안건/액션아이템/결정사항
- `apps/frontend/src/app/(dashboard)/tasks/new/page.tsx` - 담당자 선택 + 태그 프리셋
- `apps/frontend/src/app/(dashboard)/settings/page.tsx` - 4탭 (마스터데이터/재무/사용자/파트너사)
- 6개 하위 페이지에 Breadcrumb 적용

**Frontend (Neo-Brutalism 디자인)**:
- `apps/frontend/tailwind.config.ts` - brutal shadow 토큰 6종 + borderWidth
- `apps/frontend/src/app/globals.css` - @layer base 폼 입력 전역 스타일
- UI 컴포넌트 11종: Card, Button, Badge, Modal, Sidebar, Breadcrumb, Input, Select, Textarea, FileUpload, FileList
- 페이지 12라우트 + 로그인: 전체 네오브루탈 스타일 적용

#### 🎯 성과 지표
- Backend: 10개 모듈 (auth, tasks, meetings, contracts, products, **users**, audit, common, stats, files)
- Frontend: 13개 라우트 + 4개 차트 + 칸반 보드 + 파일 업로드 + 브레드크럼
- **디자인**: Soft Neo-Brutalism 전환 완료 (25파일, 유아이 × 4 병렬)
- 빌드: 3/3 패키지 성공
- QA: 5종 병렬 검수, 4건 즉시 수정 완료

---

### v0.1.0-alpha.5 - P1 기능 강화 + QA (2026-02-08)

**담당**: PM 박서연 + 송대시(Charts) + 박안도(Stats/Files API) + 유아이(Kanban/Toast) + 배포준(Docker) + 나검수(QA)

#### 📋 주요 작업

**1. 대시보드 차트 (Recharts 2.x)**
- `WeeklyTaskChart` - 주차별 업무 현황 (BarChart, 3시리즈: total/completed/inProgress)
- `TaskStatusChart` - 상태별 업무 비율 (PieChart, 컬러 매핑)
- `TaskPriorityChart` - 우선순위 분포 (PieChart)
- `MonthlyContractChart` - 월별 계약 추이 (AreaChart, 그라데이션)
- 대시보드 페이지 전면 리뉴얼: 4개 통계 카드 + 2x2 차트 그리드

**2. Backend Stats API (5개 엔드포인트)**
- `GET /api/v1/stats/dashboard` - 대시보드 전체 통계
- `GET /api/v1/stats/tasks/weekly` - 주차별 업무 통계 (12주)
- `GET /api/v1/stats/contracts/monthly` - 월별 계약 통계 (12개월)
- `GET /api/v1/stats/tasks/by-status` - 상태별 업무 비율
- `GET /api/v1/stats/tasks/by-priority` - 우선순위별 업무 비율

**3. Toast 알림 (sonner)** / **4. 칸반 보드 (@dnd-kit)** / **5. 파일 업로드 (Multer)** / **6. Docker 핫리로드**
- (상세 내용은 CHANGELOG.md 참조)

---

### v0.1.0-alpha.4 - Backend 전체 모듈 + Frontend 전체 페이지 구현 (2026-02-07)

**담당**: PM 박서연 + 박안도(Backend) + 유아이(Frontend) + Chloe(Security)

(이전 변경사항 생략 - 상세 내용은 git log 참조)

---

## 4. 현재 진행 상황 (세션 인계용)

### 마지막 작업
- **수행한 작업**:
  - P1 타입 안전성 리팩토링 (T6/T7/T9) 완료
  - Backend `any` 34개소 제거 → 2개 잔여 (Passport + Recharts 라이브러리 제약)
  - Frontend API 함수 48개 전부 shared 타입 적용, `any` 0개
  - `api-responses.ts` 신규 생성: 25+ 공유 인터페이스
  - 프론트엔드 10+ 파일에서 로컬 타입 → shared 별칭 교체
  - 대시보드 필드명 런타임 버그 수정 (`completedThisWeek`, `totalMeetings`)
  - 차트 4개 API→차트 데이터 매핑 추가
  - QA 검수 완료 (Backend 20정상/3주의/0결함, Frontend 6/6 통과)
  - Docker 이미지 재빌드 + 런타임 검증 완료
- **수정한 파일**: Backend 11파일, Frontend 15파일, Shared 2파일 (총 43파일)
- **커밋 여부**: ❌ (미커밋 - 상태 저장 후 커밋 예정)

### 진행 중 작업 (미완료)
- 없음 (P1 타입 리팩토링 완료)

### 다음 세션 TODO (PM 종합 우선순위)

**즉시**:
1. 전체 변경사항 커밋 + 푸시

**Phase B: 핵심 개선 (잔여)**:
1. 공통 컴포넌트 추출 — Pagination, Table (유아이, 6h) ← EmptyState/Skeleton 완료
2. SWR 데이터 fetching 표준화 (유아이, 12h)
3. 차트 인터랙션 드릴다운 + 스파크라인 (송대시, 8h)
4. Redis 캐싱 (Dashboard Stats, Products) (박안도, 8h)
5. meetings 페이지 `any` 제거 - MeetingResponse 적용 (유아이, 4h)

**Phase C: 안정화 (~60h)**:
1. 나머지 Frontend `any` 정리 - catch(err:any), payload:any 등 (유아이, 8h)
2. 테이블 정렬 기능 (송대시, 4h)
3. localStorage → HttpOnly Cookie + CSRF (Chloe+박안도, 16h)
4. Backend Unit Test 60% 커버리지 (박안도, 20h)
5. JWT Payload 주석 개선 (박안도, 0.5h) — QA 권고사항

---

## 5. 팀 구성 및 역할

| 역할 | 이름 | 담당 영역 | 현재 작업 |
|------|------|-----------|----------|
| **PM** | 박서연 | 요구사항, 일정 관리 | P1 타입 리팩토링 완료, 커밋 대기 |
| **Backend** | 박안도 | API, DB, 서버 로직 | Backend `any` 34→2개 제거 완료 ✅ |
| **Frontend** | 유아이 | UI/UX, 컴포넌트 | API 48함수 타입 강화 + shared DTO 통합 완료 ✅ |
| **Security** | Chloe O'Brian | 보안, 암호화 | XSS sanitizeHtml + HTTP Exception 강화 완료 ✅ |
| **DevOps** | 배포준 | CI/CD, 인프라 | 프로덕션 Docker 대기 |
| **QA** | 나검수 | 테스트, 품질 보증 | P1 리팩토링 QA 완료 (Backend+Frontend 0결함) ✅ |
| **Visualization** | 송대시 | 차트, 시각화 | 드릴다운 대기 |
| **Docs** | 문서인 | 문서화 | Stats API 문서 유지 ✅ |
| **Data Analyst** | 이지표 | KPI, 분석 | 대시보드 데이터 유지 ✅ |

---

## 6. 기술 부채 및 개선 과제

### ✅ 완료 (P0)
- [x] Backend validation API 구현 (class-validator)
- [x] 계약 금액 암호화 (AES-256-GCM)
- [x] 감사 로그 (90일 보존)
- [x] 공통 컴포넌트 라이브러리 (9개 + Breadcrumb)
- [x] 대시보드 차트 4개 (Recharts)
- [x] 칸반 보드 (@dnd-kit)
- [x] 토스트 알림 (sonner)
- [x] 파일 업로드 (Multer)
- [x] Docker 핫리로드 개발 환경
- [x] API 라우팅 글로벌 프리픽스 (/api/v1)
- [x] Path Traversal 방지
- [x] 계약 재무 확장 (매입/판매/마진/결제주기/VAT)
- [x] Users CRUD 모듈
- [x] 회의록 폼 강화 (참석자/안건/액션아이템)
- [x] 설정 페이지 4탭 (마스터데이터/재무/사용자/파트너사)
- [x] 만료 알림 뱃지 (사이드바 + 대시보드)
- [x] 계약 파일 첨부 (드래그&드롭)
- [x] 브레드크럼 (6개 하위 페이지)
- [x] SQL Injection 방어 (sortBy 화이트리스트)
- [x] Swagger 프로덕션 비활성화
- [x] Soft Neo-Brutalism 디자인 시스템 (25파일, 유아이×4 병렬)

### 🔴 CRITICAL (P0.5) - 4부서 분석 신규 발견
- [x] useEffect/useCallback 무한 루프 제거 (v0.1.0-alpha.7)
- [x] 에러 처리 toast 전역 통일 (v0.1.0-alpha.7)
- [ ] JWT Secret 재생성 + .env Git 이력 제거
- [x] N+1 쿼리 최적화 - Stats Service queryBuilder 전환 (v0.1.0-alpha.7)
- [ ] Redis 캐싱 도입 (Dashboard Stats, Products)

### ⚠️ High (P1) - 미완료
- [x] Rate Limiting - @nestjs/throttler 전역 60req/min (v0.1.0-alpha.7)
- [ ] 공통 컴포넌트 추출 (Pagination, Table) ← EmptyState/Skeleton 완료
- [ ] SWR 데이터 fetching 표준화
- [x] 파이→도넛 차트 + Priority 수평 Bar + 차트 접근성(색맹) (v0.1.0-alpha.7)
- [ ] 차트 인터랙션 드릴다운 + 통계 카드 스파크라인
- [x] API 응답 형식 통일 + Shared 타입 정의 (v0.1.0-alpha.10 P1 리팩토링)
- [x] Helmet 보안 헤더 (v0.1.0-alpha.7)
- [ ] JWT HS256 → RS256 전환
- [ ] Refresh Token Redis 저장소
- [x] FilesController RolesGuard 추가 (v0.1.0-alpha.7)
- [ ] CSRF 토큰 적용
- [x] 페이지네이션 UI 통일 - Tasks/Meetings/Contracts (v0.1.0-alpha.8)
- [x] 사용자 추가 API (POST /users) + 모달 UI (v0.1.0-alpha.8)
- [x] 태그 삭제 UI + 칸반 태그 표시 (v0.1.0-alpha.8)

### 📝 Medium (P2) - 미완료
- [x] TypeScript `any` → 명시적 타입 (v0.1.0-alpha.10 P1 리팩토링, Backend 34→2, Frontend API 48→0)
- [ ] 나머지 Frontend `any` 정리 (meetings 페이지, catch/payload 패턴)
- [x] 차트 Neo-Brutalism 통일 (v0.1.0-alpha.7)
- [ ] 테이블 정렬 기능
- [ ] localStorage → HttpOnly Cookie 전환
- [ ] Backend Unit Test 60% 커버리지
- [ ] 프로덕션 Docker Compose 구성
- [ ] 색상 팔레트 확장 (success/warning/danger)
- [ ] Modal 개선 (Portal, Footer, Size)
- [x] Skeleton UI 로딩 상태 (v0.1.0-alpha.7)
- [ ] 접근성(a11y) 강화 (키보드, ARIA)
- [ ] 리포트/PDF 생성
- [ ] 전문검색 (PostgreSQL tsvector)
- [ ] E2E 테스트 (Playwright)
- [ ] CI/CD 파이프라인
- [ ] 사용자 매뉴얼
- [ ] JWT Payload 주석 개선 (QA 권고)

---

## 7. 참고 링크

- **Docker 개발 환경**: [infra/docker/README.md](./infra/docker/README.md)
- **포트 정보**:
  - Frontend: http://localhost:3001
  - Backend API: http://localhost:4001/api/v1
  - Swagger: http://localhost:4001/api/docs (개발 환경만)
  - PostgreSQL: localhost:5433
  - Redis: localhost:6380

---

### 📊 4부서 심층 분석 결과 요약 (2026-02-08)

| 부서 | 담당 | 점수 | 핵심 키워드 |
|------|------|------|-------------|
| Frontend/UI/UX | 유아이 | 7.1/10 | 디자인 일관성 양호, 상태관리 취약 |
| 데이터 시각화 | 송대시 | 7.4/10 | 차트 기본기 양호, 인터랙션/접근성 부족 |
| Backend API | 박안도 | 7.8/10 | RESTful 우수, 캐싱/테스트 부재 |
| 보안/인프라 | Chloe+배포준 | 5.5/10 | 기본 프레임워크 구축, 프로덕션 준비 미흡 |

---

**다음 작업 시작 시점**: P1 타입 리팩토링 완료, Phase B 잔여 작업 진행 예정
**예상 정식 릴리스**: 2026-03-21 (v0.1.0)
