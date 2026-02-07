# MsspBizCenter

**MSSP 비즈니스 센터** - 팀 업무 포털 시스템

## 프로젝트 개요

MsspBizCenter는 MSSP(Managed Security Service Provider) 조직을 위한 통합 업무 관리 포털입니다.
기존 "미시시피(Mississippi)" 시스템의 차세대 버전으로, 주차별 업무 일지, 회의록, 계약 관리 기능을 제공합니다.

## 주요 기능

### 1. 주차별 업무 일지 (Task Management)
- 주차 단위 Task 등록/관리
- 담당자 지정 및 진행 상태 추적
- 우선순위 및 마감일 관리
- 칸반 보드 뷰 지원

### 2. 회의록 (Meeting Notes)
- 회의 정보 기록 (제목, 일시, 참석자)
- 안건 및 결정사항 관리
- Action Item 추적 및 Task 연동
- Markdown 지원

### 3. 계약 관리 (Contract Management)
- 계약 정보 등록 및 관리
- 계약 기간/금액/당사자 관리
- 만료 알림 (30일/7일 전)
- 갱신 이력 추적

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Backend** | NestJS 10, TypeORM, PostgreSQL 15 |
| **Infra** | Docker Compose, Redis |
| **Testing** | Jest (Backend), Vitest (Frontend), Playwright (E2E) |

## 프로젝트 구조

```
MsspBizCenter/
├── apps/
│   ├── backend/          # NestJS API 서버
│   │   └── src/
│   │       └── modules/
│   │           ├── auth/       # 인증/권한
│   │           ├── task/       # 주차별 업무 일지
│   │           ├── meeting/    # 회의록
│   │           └── contract/   # 계약 관리
│   └── frontend/         # Next.js 웹 앱
│       └── src/
│           └── app/
│               ├── tasks/      # Task 페이지
│               ├── meetings/   # 회의록 페이지
│               └── contracts/  # 계약 페이지
├── docs/                 # 설계 문서
└── infra/                # Docker 설정
```

## 개발 환경 실행

### 사전 요구사항

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# Docker 환경 실행 (PostgreSQL, Redis)
cd infra/docker
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d

# 개발 서버 실행
pnpm dev
```

### 접속 URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **Swagger**: http://localhost:4000/api/docs

## 스크립트

```bash
# 개발
pnpm dev              # 전체 개발 서버 실행
pnpm build            # 전체 빌드
pnpm test             # 전체 테스트
pnpm lint             # 전체 린트

# Backend
pnpm --filter @msspbiz/backend dev
pnpm --filter @msspbiz/backend test
pnpm --filter @msspbiz/backend build

# Frontend
pnpm --filter @msspbiz/frontend dev
pnpm --filter @msspbiz/frontend test
pnpm --filter @msspbiz/frontend build
```

## 버전 관리

- 버전 파일: `VERSION`
- 현재 버전: `0.1.0-alpha.1`
- Semantic Versioning 2.0.0 준수

## 라이선스

Private - All rights reserved

## 개발팀

- PM: 정하윤
- Backend: 박안도
- Frontend: 유아이
- Security: Chloe O'Brian
- DevOps: 배포준
