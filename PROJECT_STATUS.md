# MsspBizCenter 프로젝트 상태

**마지막 업데이트**: 2026-02-07
**현재 버전**: v0.1.0-alpha.3
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
│   └── frontend/         # Next.js 15 앱 (포트 3001)
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

### v0.1.0-alpha.3 - 독립 플랫폼 기술 스택 전환 (2026-02-07)

**담당**: PM 박서연 + 전체 팀

#### 📋 주요 작업

**1. 기술 스택 전면 재설계**
- 개발팀 전체 회의 (9명 참석): 독립 플랫폼 스택 결정
- Flask + React + MariaDB → **NestJS + Next.js + PostgreSQL** 전환
- 전원 만장일치 결정 사유:
  - CTEM 프로젝트 코드/패턴 재활용 (Auth, Audit 등)
  - 풀스택 TypeScript로 Backend/Frontend 타입 공유
  - Node.js 단일 런타임으로 인프라 단순화
  - PostgreSQL의 JSONB, 전문검색, 분석함수 활용

**2. 기존 코드 삭제 및 신규 프로젝트 초기화**
- Flask Backend 삭제 → NestJS 10 프로젝트 생성
- React + Vite Frontend 삭제 → Next.js 15 (App Router) 프로젝트 생성
- packages/shared 패키지 생성 (Enum, 타입, 상수 공유)

**3. NestJS Backend 설정**
- TypeORM + PostgreSQL 16 연결 설정
- Swagger API 문서 자동 생성 (/api/docs)
- ValidationPipe 글로벌 설정
- CORS 활성화
- 의존성: @nestjs/typeorm, @nestjs/swagger, @nestjs/passport, @nestjs/jwt, class-validator 등

**4. Next.js Frontend 설정**
- App Router 구조 (src/app/)
- Tailwind CSS 3.x + PostCSS
- API 프록시 (rewrites)
- 의존성: SWR, Recharts, Iconoir, @dnd-kit

**5. packages/shared 공유 패키지**
- Enum: TaskStatus, TaskPriority, MeetingType, ContractType, UserRole, AuditAction 등
- Types: ApiResponse, PaginatedResponse, JwtPayload, BaseEntity 등
- Constants: API_PREFIX, 페이지네이션 기본값, 파일 업로드 제한 등

**6. Docker Compose PostgreSQL 전환**
- MariaDB 10.11 → PostgreSQL 16 Alpine
- 포트: 5433 (CTEM 5432와 충돌 방지)
- 환경변수 전체 NestJS/PostgreSQL 기준으로 업데이트

**7. 문서 전면 업데이트**
- CLAUDE.md: 기술 스택, 개발 환경, 프로젝트 구조 전면 변경
- planning.md: v1.2로 업데이트 (독립 플랫폼 전환)
- Docker README.md: PostgreSQL 기준으로 재작성

#### 📁 수정된 파일
- `apps/backend/` - NestJS 프로젝트 (신규 생성)
- `apps/frontend/` - Next.js 프로젝트 (신규 생성)
- `packages/shared/` - 공유 타입 패키지 (신규 생성)
- `infra/docker/docker-compose.dev.yml` - PostgreSQL 전환
- `infra/docker/.env.example`, `.env` - 환경변수 업데이트
- `infra/docker/README.md` - PostgreSQL 기준 재작성
- `CLAUDE.md` - 기술 스택 전면 변경
- `docs/design/planning.md` - v1.2 업데이트
- `package.json`, `turbo.json`, `pnpm-workspace.yaml` - 모노레포 설정
- `.gitignore` - 업데이트
- `VERSION` - 0.1.0-alpha.3

#### 🎯 성과 지표
- 기술 스택 전환 완료 (Flask → NestJS, React+Vite → Next.js, MariaDB → PostgreSQL)
- 모노레포 구조 확립 (apps/ + packages/)
- 공유 타입 패키지로 Backend/Frontend 타입 일관성 확보
- CTEM 코드 재활용 기반 마련

---

### v0.1.0-alpha.2 - 목업 검토 및 보완 기획 수립 ✅ 완료 (2026-02-07)

**담당**: PM 박서연 + 전체 팀

#### 📋 주요 작업

**1. 마스터 데이터 확장 (유아이)**
- `mockup/settings.html` 수정
- 마스터 데이터 섹션을 5개 → **6개 카드**로 확장
- **Row 1** (제품 및 파트너, 3개):
  - 판매 제품 관리 (indigo)
  - 매입 제품 관리 (blue)
  - 파트너 관리 (purple)
- **Row 2** (계약 및 인력, 3개):
  - **계약 관리 (teal) ← NEW**
    - PoC (Proof of Concept) - 개념 증명 및 기술 검증 계약
    - 데모 (Demo) - 시연 및 테스트 목적 계약
    - 정식 계약 - 정규 상용 라이선스 계약
    - 갱신 계약 - 기존 계약 연장 및 갱신
    - 신규 계약 - 신규 고객사 신규 도입 계약
  - 영업 담당자 관리 (green)
  - 고객사 관리 (amber)
- 레이아웃: 3-3 Grid (`grid-cols-1 md:grid-cols-3`)
- Heroicons Outline SVG 아이콘 적용

**2. 개발팀 전체 목업 검토 회의**
- **참석**: 9명 (PM, Backend, Frontend, Security, DevOps, QA, Docs, Data Analyst, Visualization)
- **검토 내용**:
  - ✅ 기본 구조 승인 (3개 핵심 모듈)
  - ⚠️ 보안 강화 필요 (CSRF, 서버 validation, XSS 방지)
  - ⚠️ 사용성 개선 (검색/필터, 대시보드 차트, 알림, 드래그앤드롭)
  - ⚠️ 공통 컴포넌트 부족 (Button, Input, Select 등 8개 필요)
  - ⚠️ 데이터 분석 기능 부재 (Excel 다운로드, KPI 차트)
  - ⚠️ 문서화 누락 (API 문서, 사용자 매뉴얼)

**3. 보완 기획안 수립 (PM 박서연)**

**Phase 1: 알파 완성** (2/10 ~ 2/21, v0.1.0-alpha.2 ~ alpha.5)
- P0 항목:
  - Backend validation API (박안도)
  - CSRF 토큰 적용 (Chloe)
  - Action Item → Task 연동 (박안도 + 유아이)
  - 계약 만료 알림 (박안도 + 유아이)
  - 공통 컴포넌트 8개 (유아이)

**Phase 2: 베타 준비** (2/24 ~ 3/7, v0.1.0-beta.1)
- P1 항목:
  - 대시보드 차트 4개 (송대시 + 이지표)
  - 검색/필터 기능 (박안도 + 유아이)
  - Excel 다운로드 (박안도)
  - 드래그앤드롭 칸반 (유아이)

**Phase 3: QA 및 문서화** (3/10 ~ 3/14, v0.1.0-rc.1)
- E2E 테스트 10개 시나리오 (나검수)
- API 문서 Swagger (박안도 + 문서인)
- 사용자 매뉴얼 7개 문서 (문서인)

**Phase 4: 배포** (3/17 ~ 3/21, v0.1.0)
- CI/CD 파이프라인 (배포준)
- 프로덕션 배포 (AWS ECS)

**기술 스택 결정**:
- 차트: `recharts` (React 19 호환)
- 드래그앤드롭: `@dnd-kit/core`
- 토스트 알림: `sonner` 또는 `react-hot-toast`
- API 문서: `flasgger` (Swagger)
- E2E 테스트: `@playwright/test`

#### 📁 수정된 파일
- `mockup/settings.html` - 계약 관리 마스터 데이터 추가 (579줄)

#### 🎯 성과 지표
- 마스터 데이터: 5개 → 6개 (계약 유형 관리 추가)
- 기획 문서: Phase 1~4 로드맵 수립 완료
- 우선순위 백로그: P0(6개), P1(5개), P2(3개) 정리 완료

---

### v0.1.0-alpha.1 - 초기 프로젝트 구조 생성 ✅ 완료 (2026-02-06)

**담당**: PM 박서연

#### 📋 주요 작업

**1. 프로젝트 초기 설정**
- Git 저장소 생성
- Monorepo 폴더 구조 생성
- Docker 개발 환경 구성 (MariaDB, Redis)
- CLAUDE.md 작성 (개발 가이드)

**2. HTML 목업 제작** (9개 파일)
- `mockup/index.html` - 메인 포털
- `mockup/tasks.html` - 업무 일지 칸반 보드
- `mockup/task-new.html` - 새 업무 등록
- `mockup/meetings.html` - 회의록 목록
- `mockup/meeting-new.html` - 새 회의록
- `mockup/contracts.html` - 계약 목록
- `mockup/contract-new.html` - 새 계약 등록 (재무 계산 포함)
- `mockup/contract-detail.html` - 계약 상세
- `mockup/settings.html` - 설정 (마스터 데이터, 사용자 관리)

**3. 재무 계산 기능 구현**
- 매입가 + 매입 수수료율 → 실제 매입가
- 판매가 - 파트너 수수료 → 실제 판매가
- 기본 마진율 vs 실제 마진율 계산
- 색상 코딩: 빨강(<0%), 주황(0-20%), 초록(≥20%)
- JavaScript로 실시간 계산

**4. 아이콘 교체**
- 모든 이모지 → Heroicons Outline SVG로 교체
- 15개 아이콘 타입 변환 완료
- Tailwind CSS 호환

#### 📁 생성된 파일
- `CLAUDE.md` - 개발 가이드
- `VERSION` - 0.1.0-alpha.1
- `infra/docker/README.md` - Docker 가이드
- `infra/docker/.env.example` - 환경변수 템플릿
- `mockup/*.html` - 9개 HTML 목업
- `.gitignore` - Git 제외 파일

#### 🎯 성과 지표
- HTML 목업: 9개 파일 완성
- 재무 계산: 3색 마진율 시각화 구현
- 마스터 데이터: 5개 섹션 (판매 제품, 매입 제품, 파트너, 영업 담당자, 고객사)

---

## 4. 현재 진행 상황 (세션 인계용)

### 마지막 작업
- **수행한 작업**:
  - 독립 플랫폼 기술 스택 재설계 회의 (전원 만장일치: NestJS + Next.js + PostgreSQL)
  - 기존 Flask/React 코드 삭제 후 NestJS/Next.js 프로젝트 초기화
  - packages/shared 공유 타입 패키지 생성
  - Docker Compose PostgreSQL 전환
  - 전체 문서 업데이트 (CLAUDE.md, planning.md, Docker README)
  - NestJS 피어 의존성 해결 (^11 → ^10.4.0 다운그레이드)
  - `pnpm build` 전체 빌드 검증 완료 (3/3 패키지 성공)
- **수정한 파일**: 103개 (5,565줄 추가, 4,751줄 삭제)
- **커밋 여부**: ✅ `a1b6e3e` 커밋 및 push 완료

### 진행 중 작업 (미완료)
- [ ] NestJS 모듈 구조 생성 (auth, users, tasks, meetings, contracts)
- [ ] CTEM Auth/Audit 모듈 포팅
- 막힌 부분: 없음

### 다음 세션 TODO

**우선순위 1 (Backend 핵심 모듈)**:
1. Auth 모듈 포팅 (CTEM 참조: JWT RS256, Refresh Token, RBAC)
2. User/Tenant 엔티티 및 모듈 생성
3. Task 모듈 (Entity, DTO, Service, Controller)
4. DB 마이그레이션 설정

**우선순위 2 (Frontend 기본 구조)**:
1. 인증 페이지 (로그인/회원가입)
2. 레이아웃 (Sidebar, Header)
3. Task 목록 페이지 (SWR + API 연동)
4. 공통 컴포넌트 (Button, Input, Select 등)

**우선순위 3 (인프라)**:
1. Docker Compose로 전체 환경 테스트
2. CI/CD 파이프라인 설정 (GitHub Actions)

---

## 5. 팀 구성 및 역할

| 역할 | 이름 | 담당 영역 | 현재 작업 |
|------|------|-----------|----------|
| **PM** | 박서연 | 요구사항, 일정 관리 | 기술 스택 전환 완료 ✅ |
| **Backend** | 박안도 | API, DB, 서버 로직 | NestJS 프로젝트 초기화 완료 ✅ |
| **Frontend** | 유아이 | UI/UX, 컴포넌트 | Next.js 프로젝트 초기화 완료 ✅ |
| **Security** | Chloe O'Brian | 보안, 암호화 | CTEM Auth 모듈 포팅 예정 |
| **DevOps** | 배포준 | CI/CD, 인프라 | PostgreSQL Docker 설정 완료 ✅ |
| **QA** | 나검수 | 테스트, 품질 보증 | E2E 시나리오 작성 예정 |
| **Docs** | 문서인 | 문서화 | 기술 스택 문서 업데이트 완료 ✅ |
| **Data Analyst** | 이지표 | KPI, 분석 | PostgreSQL 분석함수 리서치 예정 |
| **Visualization** | 송대시 | 차트, 시각화 | Recharts 호환성 검증 예정 |

---

## 6. 기술 부채 및 개선 과제

### 🚨 Critical (P0)
- [ ] Backend validation API 구현 (클라이언트 계산 재검증)
- [ ] CSRF 토큰 적용
- [ ] XSS 방지 (DOMPurify)
- [ ] 계약 금액 암호화 (AES-256-GCM)
- [ ] 감사 로그 (90일 보존)

### ⚠️ High (P1)
- [ ] 대시보드 차트 4개 (월별 매출, 제품 비율, 마진 분포, 담당자 실적)
- [ ] 검색/필터 기능
- [ ] Excel 다운로드
- [ ] 공통 컴포넌트 라이브러리
- [ ] API 문서 (Swagger)

### 📝 Medium (P2)
- [ ] 드래그앤드롭 칸반 보드
- [ ] 사용자 매뉴얼 7개 문서
- [ ] 고급 분석 기능
- [ ] UI 폴리싱

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

**다음 작업 시작 시점**: 2026-02-10 (Phase 1 알파 완성 시작)
**예상 정식 릴리스**: 2026-03-21 (v0.1.0)
