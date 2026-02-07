# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code (claude.ai/code)에게 가이드를 제공합니다.

## 프로젝트 개요

- **프로젝트명**: MsspBizCenter - MSSP 비즈니스 센터 (팀 업무 포털)
- **아키텍처**: Monorepo (pnpm Workspaces + Turborepo) + Docker 기반
- **멀티테넌시**: 모든 데이터는 `tenant_id`로 격리, JWT에 `tenantId` 포함
- **현재 버전**: v0.1.0-alpha.1 (VERSION 파일 참조)

## 주요 기능

| 모듈 | 설명 |
|------|------|
| **Task** | 주차별 업무 일지 - Task 등록/관리, 담당자 지정, 상태 추적 |
| **Meeting** | 회의록 - 회의 내용 기록, 참석자 관리, Action Item 추적 |
| **Contract** | 계약 관리 - 계약 정보, 만료 알림, 갱신 이력 (금액 암호화) |

## 버전 관리 규칙 (필수)

**단일 버전 소스:** `VERSION` 파일 (루트 디렉토리)

**Semantic Versioning 2.0.0 준수:** https://semver.org/

```
MAJOR.MINOR.PATCH[-PRERELEASE]

예: 0.1.0-alpha.1
    │ │ │  └── 프리릴리스 태그 (alpha/beta/rc)
    │ │ └── PATCH: 버그 수정
    │ └── MINOR: 기능 추가 (하위 호환)
    └── MAJOR: 호환성 깨지는 변경
```

**버전 체계:**
| 단계 | 버전 형식 | 의미 |
|------|-----------|------|
| 알파 | `0.1.0-alpha.N` | 초기 개발, 기능 구현 중 |
| 베타 | `0.1.0-beta.N` | 기능 완성, 안정화 진행 중 |
| 정식 | `0.1.0` | 베타 종료, 안정화 완료 |
| 패치 | `0.1.1` | 정식 버전 버그 수정 |

**커밋 시 반드시 다음을 수행:**
1. `VERSION` 파일의 버전 번호 증가
2. package.json 3개 파일에 동기화
3. 커밋 메시지에 `(v버전)` 태그 포함

```bash
# 1. VERSION 파일 읽기
cat VERSION  # 예: 0.1.0-alpha.1

# 2. 버전 증가 후 package.json 동기화
NEW_VERSION="0.1.0-alpha.2"
echo "$NEW_VERSION" > VERSION
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json apps/backend/package.json apps/frontend/package.json

# 3. 확인
grep '"version"' package.json apps/backend/package.json apps/frontend/package.json
```

## 개발 환경 실행

```bash
# Docker 개발 환경 (권장)
cd infra/docker
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d

# 로컬 개발 (Docker 없이)
pnpm install
pnpm dev
```

**중요**: 반드시 `docker compose` (v2) 사용. `docker-compose` (v1)은 오류 발생

### 환경 변수 설정

| 위치 | 파일 | 용도 |
|------|------|------|
| `infra/docker/` | `.env` | Docker Compose 전체 환경 |
| `apps/backend/` | `.env` | Backend 로컬 개발 |
| `apps/frontend/` | `.env.local` | Frontend 로컬 개발 |

**주요 환경 변수:**
- `DB_HOST`, `DB_PASSWORD` - PostgreSQL 연결
- `REDIS_HOST`, `REDIS_PASSWORD` - Redis 연결
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - 인증 토큰
- `CONTRACT_ENCRYPTION_KEY` - 계약 금액 암호화 키 (최소 32자)
- `NEXT_PUBLIC_API_URL` - Frontend→Backend API URL (반드시 `/api/v1` 포함)

### 접속 URL

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:4001/api/v1
- **Swagger**: http://localhost:4001/api/docs

**참고**: CTEM과 포트 충돌 방지를 위해 3001/4001 사용 (CTEM은 3000/4000)

## 테스트 및 빌드

### Backend (apps/backend)

```bash
pnpm --filter @msspbiz/backend test           # 단위 테스트 (Jest)
pnpm --filter @msspbiz/backend test:e2e       # E2E 테스트
pnpm --filter @msspbiz/backend test:cov       # 커버리지
pnpm --filter @msspbiz/backend lint           # 린트
pnpm --filter @msspbiz/backend build          # 빌드
```

### Frontend (apps/frontend)

```bash
pnpm --filter @msspbiz/frontend test          # 단위 테스트 (Vitest)
pnpm --filter @msspbiz/frontend test:coverage # 커버리지
pnpm --filter @msspbiz/frontend type-check    # 타입 체크
pnpm --filter @msspbiz/frontend lint          # 린트
pnpm --filter @msspbiz/frontend build         # 빌드
```

### 전체

```bash
pnpm test    # 모든 패키지 테스트
pnpm build   # 모든 패키지 빌드
pnpm lint    # 모든 패키지 린트
```

## DB 마이그레이션

```bash
cd apps/backend

# 마이그레이션 생성 (엔티티 변경 후)
pnpm run migration:generate -- src/database/migrations/MigrationName

# 마이그레이션 실행
pnpm run migration:run

# 마이그레이션 롤백
pnpm run migration:revert
```

**주의**: 개발환경은 `DB_SYNCHRONIZE=true`, 운영환경은 반드시 마이그레이션 사용

## API 테스트

```bash
# 로그인
curl -s -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@msspbiz.local","password":"Admin@1234!"}'

# 인증 API 호출
curl http://localhost:4001/api/v1/tasks -H "Authorization: Bearer <token>"
```

## 아키텍처

### Backend 모듈 구조 (NestJS)

```
apps/backend/src/modules/
├── auth/           # 인증, 테넌트 관리 (JWT, RBAC)
├── users/          # 사용자 CRUD, 역할 관리
├── task/           # 주차별 업무 일지
│   ├── entities/   # Task, TaskComment 엔티티
│   ├── dto/        # CreateTaskDto, UpdateTaskDto
│   └── services/   # TaskService
├── meeting/        # 회의록
│   ├── entities/   # MeetingNote, MeetingAttendee, ActionItem
│   ├── dto/        # CreateMeetingDto, UpdateMeetingDto
│   └── services/   # MeetingService
├── contract/       # 계약 관리
│   ├── entities/   # Contract, ContractHistory
│   ├── dto/        # CreateContractDto, UpdateContractDto
│   └── services/   # ContractService, EncryptionService
├── file/           # 파일 업로드/다운로드
├── audit/          # 감사 로그 (90일 보존)
├── notification/   # 알림 (계약 만료 등)
└── dashboard/      # 대시보드 통계
```

### Frontend 구조 (Next.js 15 App Router)

```
apps/frontend/src/
├── app/
│   ├── layout.tsx      # 루트 레이아웃
│   ├── page.tsx        # 메인 페이지 (포털)
│   ├── tasks/          # Task 페이지
│   │   ├── page.tsx    # Task 목록
│   │   └── [id]/       # Task 상세
│   ├── meetings/       # 회의록 페이지
│   │   ├── page.tsx    # 회의록 목록
│   │   └── [id]/       # 회의록 상세
│   ├── contracts/      # 계약 페이지
│   │   ├── page.tsx    # 계약 목록
│   │   └── [id]/       # 계약 상세
│   └── settings/       # 설정
├── components/         # 재사용 컴포넌트
├── lib/
│   ├── api.ts          # API 클라이언트
│   └── utils.ts        # 유틸리티 함수
└── types/              # TypeScript 타입 정의
```

### 데이터 흐름

1. **Task 관리** → 주차별 조회 → 상태 변경 → 감사 로그 기록
2. **회의록** → Action Item 생성 → Task 연동 → 담당자 알림
3. **계약 관리** → 만료일 체크 (Cron) → 알림 발송 → 갱신 처리

## 코드 컨벤션

### 커밋 메시지

```
<type>: <description> (v0.1.x)

feat/fix/docs/style/refactor/test/chore
```

**예시:**
- `feat: Task CRUD API 구현 (v0.1.0-alpha.2)`
- `fix: 계약 금액 암호화 오류 수정 (v0.1.0-alpha.3)`
- `docs: API 문서 업데이트 (v0.1.0-alpha.4)`

### 네이밍

- 파일: `kebab-case.ts`
- 클래스: `PascalCase`
- 변수/함수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`

### 디자인 시스템

| 용도 | 색상 | Tailwind |
|------|------|----------|
| Primary | #6366F1 | indigo-500 |
| Success | #22C55E | green-500 |
| Warning | #F59E0B | amber-500 |
| Danger | #EF4444 | red-500 |
| Info | #3B82F6 | blue-500 |

### Task 상태 색상

| 상태 | 색상 | Tailwind |
|------|------|----------|
| Pending | #6B7280 | gray-500 |
| In Progress | #3B82F6 | blue-500 |
| Review | #F59E0B | amber-500 |
| Completed | #22C55E | green-500 |
| Cancelled | #EF4444 | red-500 |

## React 무한 루프/토스트 폭탄 방지

### 원인 및 해결

**1. useCallback 의존성 배열 문제**

```tsx
// 잘못된 예 - toast, t 함수 등은 매 렌더마다 새 참조
const fetchData = useCallback(async () => {
  toast.error(t('error'));
}, [toast, t]); // 무한 루프 발생!

// 올바른 예 - 실제 변경이 필요한 값만 의존성에 포함
const fetchData = useCallback(async () => {
  console.error('Failed to fetch');
}, [weekFilter]); // 필터값만 의존성에
```

**2. useEffect 의존성 문제**

```tsx
// 잘못된 예 - 객체/배열 직접 의존
useEffect(() => { ... }, [{ a: 1 }]); // 매번 새 객체!

// 올바른 예 - 원시값이나 메모이즈된 값 사용
useEffect(() => { ... }, [a]);
```

## 서브에이전트 운영 지침

### 호칭 규칙

- **사용자(PO)**: "캡틴"으로 호칭 (Product Owner, 최종 의사결정권자)
- **PM(정하윤)**: 이름 또는 "PM"으로 호칭 (태스크 조율 담당)

### 페르소나

| 역할 | 이름 | 담당 |
|------|------|------|
| PM | 정하윤 | 요구사항, 태스크 분배, 병렬 작업 조율 |
| Backend | 박안도 | API, DB, 서버 로직 |
| Frontend | 유아이 | UI/UX, 컴포넌트 |
| DevOps | 배포준 | CI/CD, 인프라 |
| QA | 나검수 | 테스트, 품질 보증 |
| Docs | 문서인 | 사용자 매뉴얼, API 문서, 릴리스 노트 |
| Security | Chloe O'Brian | 보안 검토, 암호화, 접근 제어 |
| Data Analyst | 이지표 | KPI/메트릭스, 인사이트 도출 |
| Visualization | 송대시 | 차트/그래프, 데이터 시각화 |

### 병렬 처리 원칙

**[필수] 모든 사용자 요청에 대해 병렬 처리를 기본으로 수행한다.**

- 버그 수정 + 문서 업데이트 → 병렬 실행
- Backend 수정 + Frontend 수정 (API 스펙이 동일한 경우) → 병렬 실행
- 코드 작성 + 테스트 코드 작성 → 병렬 실행
- 기능 구현 + 릴리스 노트 작성 → 병렬 실행

**병렬 처리 불가한 경우:**

- 순차적 의존성이 있는 작업 (DB 스키마 → Entity → Service → Controller)
- 이전 작업 결과에 따라 다음 작업이 결정되는 경우
- 동일 파일을 수정해야 하는 경우

### 문서 저장 위치

```
docs/
├── design/          # 기획/설계 문서
├── user-guide/      # 사용자 매뉴얼
├── admin-guide/     # 관리자 매뉴얼
├── api/             # API 문서
├── deployment/      # 배포 가이드
├── release-notes/   # 릴리스 노트
└── images/          # 스크린샷, 다이어그램
```

## 감사 로그 (Audit Log)

### 보존 정책

- 기본 보존 기간: **90일** (환경변수 `AUDIT_RETENTION_DAYS`로 조정 가능)
- 매일 자정 Cron 작업으로 만료된 로그 자동 삭제

### 기록 대상 액션

| 모듈 | 액션 |
|------|------|
| auth | login, logout, token_refresh |
| task | created, updated, deleted, status_changed, assigned |
| meeting | created, updated, deleted, published |
| contract | created, updated, deleted, status_changed, renewed, viewed (민감 정보) |
| file | uploaded, downloaded, deleted |
| settings | updated |

## 보안 고려사항

### 계약 금액 암호화

- 알고리즘: AES-256-GCM
- 키 관리: 환경변수 `CONTRACT_ENCRYPTION_KEY` (최소 32자)
- 암호화 대상: `amount` 필드
- 접근 권한: Admin/Owner만 복호화된 값 조회 가능

### 역할별 접근 권한

| 기능 | Owner | Admin | Editor | Analyst | Viewer |
|------|-------|-------|--------|---------|--------|
| Task 조회 | O | O | O | O | O |
| Task 생성/수정 | O | O | O | O | X |
| Task 삭제 | O | O | X | X | X |
| 회의록 조회 | O | O | O | O | O |
| 회의록 생성/수정 | O | O | O | O | X |
| 회의록 발행 | O | O | O | X | X |
| 계약 조회 | O | O | O | X | X |
| 계약 금액 보기 | O | O | X | X | X |
| 계약 생성/수정 | O | O | X | X | X |
| 계약 삭제 | O | X | X | X | X |

## 관련 프로젝트

- **CTEM**: `/home/wynne/othaisan/CTEM/` - 보안 위협 관리 플랫폼
- **미시시피**: 기존 MSSP 업무포털 (React 19 + Flask)
