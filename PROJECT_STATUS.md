# MsspBizCenter 프로젝트 상태

**마지막 업데이트**: 2026-02-08
**현재 버전**: v0.1.0-alpha.6
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
│   │           └── files/        # 파일 업로드 (Multer, 10MB)
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
│           │   ├── ui/           # Button, Input, Select, Badge, Modal, Card, FileUpload, FileList, Breadcrumb
│           │   ├── layout/       # Sidebar (알림 뱃지), Header
│           │   ├── charts/       # WeeklyTask, TaskStatus, TaskPriority, MonthlyContract
│           │   └── tasks/        # KanbanBoard, KanbanColumn, KanbanCard
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
  - Soft Neo-Brutalism 디자인 시스템 전환 (유아이 × 4 병렬 에이전트)
  - Foundation: tailwind.config.ts (brutal shadow 6종) + globals.css (@layer base)
  - UI 컴포넌트 11종 + 페이지 12라우트 + 로그인 = 25파일 전환
  - 빌드 검증 통과 (3/3)
  - Docker 재기동 완료
- **수정한 파일**: Frontend 25파일 (+228/-169)
- **커밋 여부**: ✅ `ceb8268` + 푸시 완료

### 진행 중 작업 (미완료)
- 없음

### 다음 세션 TODO

**우선순위 1 (보안 강화 - QA 권고)**:
1. JWT HS256 → RS256 전환 (비대칭키)
2. Refresh Token Redis 저장소 구현
3. FilesController RolesGuard 추가 (DELETE 권한 제한)
4. MIME 타입 화이트리스트 강화
5. Rate Limiting (ThrottlerModule)

**우선순위 2 (고급 기능)**:
1. 리포트/PDF 생성
2. 전문검색 (PostgreSQL tsvector)
3. Sub-Task 기능
4. Excel 다운로드

**우선순위 3 (인프라/QA)**:
1. E2E 테스트 (Playwright)
2. CI/CD 파이프라인 (GitHub Actions)
3. API 문서 (Swagger 완성)
4. 사용자 매뉴얼

---

## 5. 팀 구성 및 역할

| 역할 | 이름 | 담당 영역 | 현재 작업 |
|------|------|-----------|----------|
| **PM** | 박서연 | 요구사항, 일정 관리 | GAP 분석 + 전량 구현 완료 ✅ |
| **Backend** | 박안도 | API, DB, 서버 로직 | Users모듈 + 재무확장 + SQL방어 ✅ |
| **Frontend** | 유아이 | UI/UX, 컴포넌트 | Neo-Brutalism 전환 완료 ✅ |
| **Security** | Chloe O'Brian | 보안, 암호화 | SQL Injection + Swagger 수정 ✅ |
| **DevOps** | 배포준 | CI/CD, 인프라 | Docker 핫리로드 유지 ✅ |
| **QA** | 나검수 | 테스트, 품질 보증 | 5종 병렬 검수 완료 ✅ |
| **Visualization** | 송대시 | 차트, 시각화 | Recharts 4개 차트 유지 ✅ |
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

### ⚠️ High (P1) - 미완료
- [ ] JWT HS256 → RS256 전환
- [ ] Refresh Token Redis 저장소
- [ ] FilesController RolesGuard 추가
- [ ] MIME 타입 화이트리스트 강화
- [ ] Rate Limiting (ThrottlerModule)
- [ ] CSRF 토큰 적용
- [ ] XSS 방지 (DOMPurify)

### 📝 Medium (P2) - 미완료
- [ ] 리포트/PDF 생성
- [ ] 전문검색 (PostgreSQL tsvector)
- [ ] Sub-Task 기능
- [ ] Excel 다운로드
- [ ] E2E 테스트 (Playwright)
- [ ] CI/CD 파이프라인
- [ ] 사용자 매뉴얼
- [ ] `any` 타입 → 명시적 타입 정의

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

**다음 작업 시작 시점**: 2026-02-10 (보안 강화 + Phase 2 고급 기능)
**예상 정식 릴리스**: 2026-03-21 (v0.1.0)
