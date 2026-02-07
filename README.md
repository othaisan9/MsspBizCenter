# MsspBizCenter

**MSSP 비즈니스 센터** - 팀 업무 포털 시스템

## 프로젝트 개요

MsspBizCenter는 MSSP(Managed Security Service Provider) 조직을 위한 통합 업무 관리 포털입니다.
기존 "미시시피(Mississippi)" 포털에 추가할 팀 업무관리 기능으로, 주차별 업무 일지, 회의록, 계약 관리 기능을 제공합니다.
독립 실행 후 SSO(Single Sign-On)를 통해 미시시피와 통합 예정입니다.

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
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS |
| **Backend** | Flask 3.x, SQLAlchemy 2.x, MariaDB 10.x |
| **Infra** | Docker Compose, Redis |
| **Testing** | pytest (Backend), Vitest (Frontend) |

**통합 계획**: 기존 미시시피 포털(https://mssp.leaked.id)과 SSO 연동

## 프로젝트 구조

```
MsspBizCenter/
├── apps/
│   ├── backend/          # Flask API 서버
│   │   ├── app/
│   │   │   ├── api/          # Flask Blueprint
│   │   │   │   ├── auth.py   # 인증/권한
│   │   │   │   ├── tasks.py  # Task CRUD
│   │   │   │   ├── meetings.py   # 회의록
│   │   │   │   └── contracts.py  # 계약 관리
│   │   │   ├── models/       # SQLAlchemy 모델
│   │   │   └── services/     # 비즈니스 로직
│   │   └── migrations/       # Alembic 마이그레이션
│   └── frontend/         # React 웹 앱
│       └── src/
│           ├── pages/        # React 페이지
│           │   ├── Tasks/
│           │   ├── Meetings/
│           │   └── Contracts/
│           └── components/   # 재사용 컴포넌트
├── docs/                 # 설계 문서
└── infra/                # Docker 설정
```

## 개발 환경 실행

### 사전 요구사항

- Python >= 3.11
- Node.js >= 20.0.0
- npm 또는 pnpm
- Docker & Docker Compose

### 설치 및 실행

```bash
# Docker 환경 실행 (MariaDB, Redis)
cd infra/docker
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d

# Backend (Flask)
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run --port 4001

# Frontend (React + Vite)
cd apps/frontend
npm install  # 또는 pnpm install
npm run dev  # 또는 pnpm dev
```

### 접속 URL

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:4001/api/v1
- **Swagger**: http://localhost:4001/api/docs

**참고**: CTEM과 포트 충돌 방지를 위해 3001/4001 사용 (CTEM은 3000/4000)

## 주요 명령어

```bash
# Backend (Flask)
cd apps/backend
flask run               # 개발 서버 실행
pytest                  # 테스트 실행
flask db upgrade        # DB 마이그레이션 적용

# Frontend (React)
cd apps/frontend
npm run dev             # 개발 서버 실행
npm run build           # 프로덕션 빌드
npm test                # 테스트 실행
```

## 버전 관리

- 버전 파일: `VERSION`
- 현재 버전: `0.1.0-alpha.1`
- Semantic Versioning 2.0.0 준수

## 라이선스

Private - All rights reserved

## 개발팀

- PM: 박서연
- Backend: 박안도
- Frontend: 유아이
- Security: Chloe O'Brian
- DevOps: 배포준

## 관련 프로젝트

- **미시시피**: https://mssp.leaked.id - 기존 MSSP 업무포털 (통합 대상)
