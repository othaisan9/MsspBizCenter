# MsspBizCenter 프로젝트 상태

**마지막 업데이트**: 2026-02-07
**현재 버전**: v0.1.0-alpha.4
**개발 브랜치**: `master` (main 브랜치로 PR 예정)

---

## 참조 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 개발 가이드, 아키텍처, 코드 컨벤션 |
| [CHANGELOG.md](./CHANGELOG.md) | 전체 변경 이력 (아카이브) |
| [VERSION](./VERSION) | 현재 버전 (단일 소스) |
| [infra/docker/README.md](./infra/docker/README.md) | Docker 개발 환경 가이드 |

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
1. **Task 관리** - 주차별 업무 일지, 칸반 보드
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
│   │           └── audit/        # 감사 로그
│   └── frontend/         # Next.js 15 앱 (포트 3001)
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # 로그인/회원가입
│           │   └── (dashboard)/  # 인증된 사용자 페이지
│           │       ├── tasks/    # 업무 목록/생성/상세
│           │       ├── meetings/ # 회의록 목록/생성/상세
│           │       └── contracts/# 계약 목록/생성/상세
│           ├── components/       # UI 컴포넌트 (Button, Input, Card 등)
│           └── lib/              # API Client, Auth Context, Utils
├── packages/
│   └── shared/           # 공유 타입/Enum/상수
├── mockup/               # HTML 프로토타입 (9개 파일)
├── infra/
│   └── docker/           # Docker Compose 개발 환경
├── docs/                 # 프로젝트 문서
├── CLAUDE.md             # 개발 가이드 (Claude Code용)
├── VERSION               # 버전 관리 (단일 소스)
├── turbo.json            # Turborepo 설정
├── pnpm-workspace.yaml   # 워크스페이스 설정
└── package.json          # 루트 워크스페이스
```

---

## 3. 최근 변경사항

### v0.1.0-alpha.4 - Backend 전체 모듈 + Frontend 전체 페이지 구현 (2026-02-07)

**담당**: PM 박서연 + 박안도(Backend) + 유아이(Frontend) + Chloe(Security)

#### 📋 주요 작업

**1. Backend 공통 모듈 (CTEM 패턴 포팅)**
- `common/entities/base.entity.ts` - BaseEntity (id, createdAt, updatedAt) + TenantBaseEntity (+tenantId)
- `common/dto/pagination.dto.ts` - PaginationDto (page, limit, sortBy, sortOrder)
- `common/decorators/` - CurrentUser, Roles 데코레이터
- `common/guards/roles.guard.ts` - 역할 기반 접근 제어
- `common/filters/http-exception.filter.ts` - 글로벌 예외 필터

**2. Auth 모듈 (JWT + Passport)**
- JWT HS256 인증 (access + refresh token)
- 회원가입 시 Tenant 자동 생성
- JwtStrategy + JwtAuthGuard
- Login/Register/Refresh/Profile API

**3. Task 모듈**
- Entity: title, description, status, priority, week, year, dueDate, assigneeId 등
- CRUD + 주차별 조회 + 상태 변경 + 담당자 지정
- 필터: status, priority, week, year, assignee, search

**4. Meeting 모듈**
- Entity: MeetingNote + MeetingAttendee + ActionItem
- CRUD + 참석자 관리 + Action Item 관리 + 발행
- 필터: meetingType, status, startDate, endDate, search

**5. Contract 모듈 (AES-256-GCM 암호화)**
- Entity: Contract + ContractHistory
- EncryptionService: 계약 금액 AES-256-GCM 암호화/복호화
- CRUD + 상태 변경 + 갱신 + 만료 알림 대시보드 + 이력 조회
- Admin 이상만 금액 조회 가능

**6. Audit Log 모듈**
- Entity: AuditLog (action, entityType, entityId, changes, ipAddress)
- 엔티티별/사용자별 조회 + 타임라인 + 자동 정리 (90일)

**7. Frontend 코어 인프라**
- `lib/api.ts` - 인증 토큰 자동 관리, 자동 리프레시 API 클라이언트
- `lib/auth-context.tsx` - AuthProvider (login/register/logout)
- `lib/utils.ts` - cn(), formatDate(), getStatusColor() 등 유틸리티
- UI 컴포넌트: Button, Input, Select, Badge, Modal, Card (6개)
- Layout: Sidebar (네비게이션 4개), Header (사용자 드롭다운)

**8. Frontend 인증 페이지**
- 로그인: email/password, 에러 표시, 리다이렉트
- 회원가입: name/email/password/tenantName

**9. Frontend 대시보드**
- 통계 카드 (업무/회의/계약 건수)
- 최근 업무 목록 + 최근 회의 목록

**10. Frontend Task 페이지 (3개)**
- 목록: 주차/상태/우선순위 필터, 검색, 페이지네이션, 테이블
- 생성: 유효성 검증 폼
- 상세: 상태 변경, 수정 모달, 삭제 확인

**11. Frontend Meeting 페이지 (3개)**
- 목록: 유형/상태/날짜 필터, 카드 레이아웃
- 생성: 회의 정보 입력 폼
- 상세: 참석자, Action Items, 발행, 삭제

**12. Frontend Contract 페이지 (3개)**
- 목록: 유형/상태 필터, 만료 임박 알림 배너
- 생성: 금액/통화/자동갱신 폼
- 상세: 금액(Admin만), 상태 변경, 갱신, 이력 타임라인

**13. 버그 수정**
- MeetingsController: `@CurrentUser('userId')` → `@CurrentUser('id')` 수정
- ContractsController: `user.userId` → `user.id` (4곳) 수정
- AppModule: AuditModule 누락 import 추가
- Card 컴포넌트: onClick prop 누락 수정

#### 📁 수정/생성된 파일

**Backend (50+ 파일)**:
- `apps/backend/src/common/` - 공통 모듈 (entities, dto, decorators, guards, filters)
- `apps/backend/src/modules/auth/` - 인증 모듈 (controller, service, module, dto, entities, strategies, guards)
- `apps/backend/src/modules/tasks/` - 업무 모듈 (controller, service, module, dto, entities)
- `apps/backend/src/modules/meetings/` - 회의록 모듈 (controller, service, module, dto, entities)
- `apps/backend/src/modules/contracts/` - 계약 모듈 (controller, service, module, dto, entities, encryption)
- `apps/backend/src/modules/audit/` - 감사 로그 모듈 (controller, service, module, dto, entities)
- `apps/backend/src/app.module.ts` - 전체 모듈 통합

**Frontend (25+ 파일)**:
- `apps/frontend/src/lib/` - api.ts, auth-context.tsx, utils.ts
- `apps/frontend/src/components/ui/` - Button, Input, Select, Badge, Modal, Card
- `apps/frontend/src/components/layout/` - Sidebar, Header
- `apps/frontend/src/app/(auth)/` - login, register 페이지
- `apps/frontend/src/app/(dashboard)/` - 대시보드, tasks (3), meetings (3), contracts (3)
- `apps/frontend/src/app/` - layout.tsx, providers.tsx (page.tsx 삭제)

#### 🎯 성과 지표
- Backend: 6개 모듈 완성 (auth, tasks, meetings, contracts, audit, common)
- Frontend: 12개 라우트 생성 (9 static + 3 dynamic)
- 빌드: 3/3 패키지 성공 (shared, backend, frontend)
- API: Task/Meeting/Contract 전체 CRUD + 고급 기능 (필터, 암호화, 감사 로그)

---

### v0.1.0-alpha.3 - 독립 플랫폼 기술 스택 전환 (2026-02-07)

**담당**: PM 박서연 + 전체 팀

#### 📋 주요 작업

**1. 기술 스택 전면 재설계**
- Flask + React + MariaDB → **NestJS + Next.js + PostgreSQL** 전환
- CTEM 프로젝트 코드/패턴 재활용 결정

**2. 기존 코드 삭제 및 신규 프로젝트 초기화**
- NestJS 10 + Next.js 15 (App Router) + packages/shared 생성

**3. Docker Compose PostgreSQL 전환**
- MariaDB 10.11 → PostgreSQL 16 Alpine

---

### v0.1.0-alpha.2 - 목업 검토 및 보완 기획 수립 ✅ 완료 (2026-02-07)

**담당**: PM 박서연 + 전체 팀

- 마스터 데이터 확장 (계약 유형 관리 추가)
- 개발팀 전체 목업 검토 회의 (9명)
- Phase 1~4 로드맵 수립

---

### v0.1.0-alpha.1 - 초기 프로젝트 구조 생성 ✅ 완료 (2026-02-06)

- Git 저장소 + Monorepo 구조 생성
- HTML 목업 9개 파일 제작
- Docker 개발 환경 구성

---

## 4. 현재 진행 상황 (세션 인계용)

### 마지막 작업
- **수행한 작업**:
  - Backend 6개 모듈 전체 구현 (auth, tasks, meetings, contracts, audit, common)
  - Frontend 전체 구현 (12 routes: 인증 2, 대시보드 1, tasks 3, meetings 3, contracts 3)
  - UI 컴포넌트 6개 (Button, Input, Select, Badge, Modal, Card)
  - Layout 2개 (Sidebar, Header)
  - API Client + Auth Context + Utils
  - 버그 수정 4건 (CurrentUser decorator, user property, AuditModule import, Card onClick)
  - `pnpm build` 전체 빌드 검증 완료 (3/3 패키지 성공)
- **커밋 여부**: ✅ v0.1.0-alpha.4 커밋 완료

### 진행 중 작업 (미완료)
- 없음 (P1~P2 완료)

### 다음 세션 TODO

**우선순위 1 (기능 강화)**:
1. 칸반 보드 (드래그앤드롭 @dnd-kit)
2. 대시보드 차트 (Recharts - 월별 매출, 제품 비율, 마진 분포, 담당자 실적)
3. 파일 업로드 기능
4. 토스트 알림 (sonner)

**우선순위 2 (고급 기능)**:
1. 리포트/PDF 생성
2. 전문검색 (PostgreSQL tsvector)
3. Sub-Task 기능
4. Excel 다운로드

**우선순위 3 (인프라/QA)**:
1. Docker Compose로 전체 환경 테스트
2. E2E 테스트 (Playwright)
3. CI/CD 파이프라인 (GitHub Actions)
4. API 문서 (Swagger 완성)

---

## 5. 팀 구성 및 역할

| 역할 | 이름 | 담당 영역 | 현재 작업 |
|------|------|-----------|----------|
| **PM** | 박서연 | 요구사항, 일정 관리 | P1~P2 작업 조율 완료 ✅ |
| **Backend** | 박안도 | API, DB, 서버 로직 | 6개 모듈 전체 구현 완료 ✅ |
| **Frontend** | 유아이 | UI/UX, 컴포넌트 | 12개 라우트 전체 구현 완료 ✅ |
| **Security** | Chloe O'Brian | 보안, 암호화 | AES-256-GCM 계약 암호화 완료 ✅ |
| **DevOps** | 배포준 | CI/CD, 인프라 | Docker 환경 테스트 예정 |
| **QA** | 나검수 | 테스트, 품질 보증 | E2E 시나리오 작성 예정 |
| **Docs** | 문서인 | 문서화 | API 문서 작성 예정 |
| **Data Analyst** | 이지표 | KPI, 분석 | 대시보드 차트 데이터 설계 예정 |
| **Visualization** | 송대시 | 차트, 시각화 | Recharts 차트 구현 예정 |

---

## 6. 기술 부채 및 개선 과제

### ✅ 완료 (P0)
- [x] Backend validation API 구현 (class-validator)
- [x] 계약 금액 암호화 (AES-256-GCM)
- [x] 감사 로그 (90일 보존)
- [x] 공통 컴포넌트 라이브러리 (6개)

### ⚠️ High (P1) - 미완료
- [ ] CSRF 토큰 적용
- [ ] XSS 방지 (DOMPurify)
- [ ] 대시보드 차트 4개 (월별 매출, 제품 비율, 마진 분포, 담당자 실적)
- [ ] 검색/필터 기능 (PostgreSQL 전문검색)
- [ ] Excel 다운로드
- [ ] API 문서 (Swagger 완성)

### 📝 Medium (P2) - 미완료
- [ ] 드래그앤드롭 칸반 보드
- [ ] 사용자 매뉴얼 7개 문서
- [ ] 파일 업로드 기능
- [ ] 토스트 알림 (sonner)
- [ ] 리포트/PDF 생성
- [ ] Sub-Task 기능

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

**다음 작업 시작 시점**: 2026-02-10 (Phase 1 알파 완성 계속)
**예상 정식 릴리스**: 2026-03-21 (v0.1.0)
