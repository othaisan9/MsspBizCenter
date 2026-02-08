# MsspBizCenter 프로젝트 상태

**마지막 업데이트**: 2026-02-08
**현재 버전**: v0.1.0-alpha.5
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
1. **Task 관리** - 주차별 업무 일지, 칸반 보드 (드래그앤드롭)
2. **Meeting 관리** - 회의록, Action Item 추적
3. **Contract 관리** - 계약 정보, 재무 계산, 만료 알림

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
│   │           ├── contracts/    # 계약 CRUD + AES-256-GCM 암호화
│   │           ├── audit/        # 감사 로그
│   │           ├── stats/        # 대시보드 통계 API (5개 엔드포인트)
│   │           └── files/        # 파일 업로드 (Multer, 10MB)
│   └── frontend/         # Next.js 15 앱 (포트 3001)
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # 로그인/회원가입
│           │   └── (dashboard)/  # 인증된 사용자 페이지
│           │       ├── tasks/    # 업무 목록/생성/상세 + 칸반
│           │       ├── meetings/ # 회의록 목록/생성/상세
│           │       └── contracts/# 계약 목록/생성/상세
│           ├── components/
│           │   ├── ui/           # Button, Input, Select, Badge, Modal, Card, FileUpload, FileList
│           │   ├── layout/       # Sidebar, Header
│           │   ├── charts/       # WeeklyTask, TaskStatus, TaskPriority, MonthlyContract
│           │   └── tasks/        # KanbanBoard, KanbanColumn, KanbanCard
│           └── lib/              # API Client, Auth Context, Utils
├── packages/
│   └── shared/           # 공유 타입/Enum/상수
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

**3. Toast 알림 (sonner)**
- `providers.tsx`에 Toaster 컴포넌트 통합
- 8개 페이지에 toast.success/toast.error 적용 (login, register, tasks/new, tasks/[id], meetings/new, meetings/[id], contracts/new, contracts/[id])

**4. 칸반 보드 (@dnd-kit)**
- `KanbanBoard` - DndContext + DragOverlay, 4개 컬럼 (pending/in_progress/review/completed)
- `KanbanColumn` - useDroppable + SortableContext, 건수 배지
- `KanbanCard` - useSortable, 드래그 이펙트, 클릭 네비게이션
- 업무 목록 페이지에 목록/칸반 뷰 토글 추가

**5. 파일 업로드 (Multer)**
- Backend: files 모듈 (entity, dto, service, controller, module)
- MIME type whitelist, 10MB 제한, tenantId별 격리 저장
- Frontend: FileUpload (드래그앤드롭), FileList (다운로드/삭제)

**6. Docker 핫리로드 개발 환경**
- `docker-compose.dev.yml`: 4개 서비스 (postgres, redis, backend, frontend)
- `Dockerfile.dev`: Backend/Frontend 각각 (pnpm workspace 지원)
- 볼륨 마운트: src/ 폴더만 매핑, node_modules anonymous volume
- WATCHPACK_POLLING + CHOKIDAR_USEPOLLING 활성화
- healthcheck + depends_on condition

**7. QA 버그 수정**
- `files.controller.ts`: `import type { Response }` 수정 (isolatedModules 호환)
- `files.controller.ts`: `user.userId` → `user.id` 수정 (JWT payload 버그)
- `main.ts`: `setGlobalPrefix('api/v1')` 추가 (API 라우팅 일관성)
- `stats.controller.ts`: 중복 프리픽스 제거 (`api/v1/stats` → `stats`)
- `files.service.ts`: tenantId Path Traversal 방지 검증 추가

#### 📁 수정/생성된 파일

**Backend**:
- `apps/backend/src/main.ts` - 글로벌 프리픽스 추가
- `apps/backend/src/app.module.ts` - StatsModule + FilesModule 등록
- `apps/backend/src/modules/stats/` - 모듈 전체 (4 파일)
- `apps/backend/src/modules/files/` - 모듈 전체 (6 파일)
- `apps/backend/docs/stats-api.md` - API 문서

**Frontend**:
- `apps/frontend/src/app/(dashboard)/page.tsx` - 차트 + 통계 카드
- `apps/frontend/src/app/(dashboard)/tasks/page.tsx` - 칸반 뷰 토글
- `apps/frontend/src/app/providers.tsx` - Toaster 추가
- `apps/frontend/src/lib/api.ts` - statsApi + filesApi 추가
- `apps/frontend/src/components/charts/` - 4개 차트 컴포넌트 + index
- `apps/frontend/src/components/tasks/` - 3개 칸반 컴포넌트
- `apps/frontend/src/components/ui/FileUpload.tsx` + `FileList.tsx`
- 8개 페이지 toast 통합

**Docker/Infra**:
- `infra/docker/docker-compose.dev.yml` - 핫리로드 설정
- `apps/backend/Dockerfile.dev` + `apps/frontend/Dockerfile.dev`
- `infra/docker/.env.example` + `.dockerignore`

#### 🎯 성과 지표
- Backend: 8개 모듈 (auth, tasks, meetings, contracts, audit, common, **stats, files**)
- Frontend: 12개 라우트 + 4개 차트 + 칸반 보드 + 파일 업로드
- 빌드: 3/3 패키지 성공
- QA: Frontend 91.2%, Backend 89.5%, Docker 100%

---

### v0.1.0-alpha.4 - Backend 전체 모듈 + Frontend 전체 페이지 구현 (2026-02-07)

**담당**: PM 박서연 + 박안도(Backend) + 유아이(Frontend) + Chloe(Security)

(이전 변경사항 생략 - 상세 내용은 git log 참조)

---

## 4. 현재 진행 상황 (세션 인계용)

### 마지막 작업
- **수행한 작업**:
  - P1 기능 5개 병렬 구현 (차트, 토스트, 칸반, 파일업로드, Docker)
  - Stats API 5개 엔드포인트 구현
  - QA 3종 병렬 검증 (Frontend/Backend/Docker)
  - QA 발견 버그 5건 수정 (import type, user.id, globalPrefix, stats prefix, path traversal)
  - 최종 빌드 검증 통과 (3/3)
- **커밋 여부**: ✅ v0.1.0-alpha.5 커밋 완료

### 진행 중 작업 (미완료)
- 없음 (P1 완료)

### 다음 세션 TODO

**우선순위 1 (고급 기능)**:
1. 리포트/PDF 생성
2. 전문검색 (PostgreSQL tsvector)
3. Sub-Task 기능
4. Excel 다운로드

**우선순위 2 (보안/안정성)**:
1. CSRF 토큰 적용
2. XSS 방지 (DOMPurify)
3. Rate Limiting (ThrottlerModule)

**우선순위 3 (인프라/QA)**:
1. E2E 테스트 (Playwright)
2. CI/CD 파이프라인 (GitHub Actions)
3. API 문서 (Swagger 완성)
4. 사용자 매뉴얼

---

## 5. 팀 구성 및 역할

| 역할 | 이름 | 담당 영역 | 현재 작업 |
|------|------|-----------|----------|
| **PM** | 박서연 | 요구사항, 일정 관리 | P1 전체 완료 ✅ |
| **Backend** | 박안도 | API, DB, 서버 로직 | Stats + Files 모듈 완료 ✅ |
| **Frontend** | 유아이 | UI/UX, 컴포넌트 | 차트 + 칸반 + 토스트 완료 ✅ |
| **Security** | Chloe O'Brian | 보안, 암호화 | Path Traversal 방지 완료 ✅ |
| **DevOps** | 배포준 | CI/CD, 인프라 | Docker 핫리로드 완료 ✅ |
| **QA** | 나검수 | 테스트, 품질 보증 | 3종 QA 검증 완료 ✅ |
| **Visualization** | 송대시 | 차트, 시각화 | Recharts 4개 차트 완료 ✅ |
| **Docs** | 문서인 | 문서화 | Stats API 문서 완료 ✅ |
| **Data Analyst** | 이지표 | KPI, 분석 | 대시보드 데이터 설계 완료 ✅ |

---

## 6. 기술 부채 및 개선 과제

### ✅ 완료 (P0)
- [x] Backend validation API 구현 (class-validator)
- [x] 계약 금액 암호화 (AES-256-GCM)
- [x] 감사 로그 (90일 보존)
- [x] 공통 컴포넌트 라이브러리 (8개)
- [x] 대시보드 차트 4개 (Recharts)
- [x] 칸반 보드 (@dnd-kit)
- [x] 토스트 알림 (sonner)
- [x] 파일 업로드 (Multer)
- [x] Docker 핫리로드 개발 환경
- [x] API 라우팅 글로벌 프리픽스 (/api/v1)
- [x] Path Traversal 방지

### ⚠️ High (P1) - 미완료
- [ ] CSRF 토큰 적용
- [ ] XSS 방지 (DOMPurify)
- [ ] Rate Limiting (ThrottlerModule)
- [ ] Stats SQL Parameterized Query 리팩토링

### 📝 Medium (P2) - 미완료
- [ ] 리포트/PDF 생성
- [ ] 전문검색 (PostgreSQL tsvector)
- [ ] Sub-Task 기능
- [ ] Excel 다운로드
- [ ] E2E 테스트 (Playwright)
- [ ] CI/CD 파이프라인
- [ ] 사용자 매뉴얼

---

## 7. 참고 링크

- **Docker 개발 환경**: [infra/docker/README.md](./infra/docker/README.md)
- **포트 정보**:
  - Frontend: http://localhost:3001
  - Backend API: http://localhost:4001/api/v1
  - Swagger: http://localhost:4001/api/docs
  - PostgreSQL: localhost:5433
  - Redis: localhost:6380

---

**다음 작업 시작 시점**: 2026-02-10 (Phase 2 고급 기능)
**예상 정식 릴리스**: 2026-03-21 (v0.1.0)
