# CLAUDE.md

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code (claude.ai/code)에게 가이드를 제공합니다.

## 프로젝트 개요

- **프로젝트명**: MsspBizCenter - MSSP 비즈니스 센터 (팀 업무포털)
- **목적**: 기존 '미시시피' MSSP 업무포털에 팀 업무관리 기능 추가
- **핵심 기능**: 주차별 업무 일지(Task), 회의록, 계약관리
- **현재 버전**: v0.1.0-alpha.1 (초기 개발 단계)
- **상세 기획**: [docs/design/planning.md](docs/design/planning.md)

## 기술 스택

**확정된 스택** (미시시피와 일관성 유지):
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Python 3.11+ + Flask 3.x
- **DB**: MariaDB 10.x (기존 미시시피와 동일)
- **Cache**: Redis 7
- **Infra**: Docker Compose
- **ORM**: SQLAlchemy 2.x
- **인증**: Flask-JWT-Extended
- **API 문서**: Flask-RESTX (Swagger)

**통합 계획**:
- 독립 실행 후 SSO(Single Sign-On)로 미시시피와 연동
- JWT 토큰 공유 방식
- 향후 프로젝트 인계를 통한 통합

## 버전 관리 규칙 (필수)

**Semantic Versioning 2.0.0 준수**: https://semver.org/

```
MAJOR.MINOR.PATCH[-PRERELEASE]
예: 0.1.0-alpha.1
```

**버전 체계**:
- 알파: `0.1.0-alpha.N` - 초기 개발, 기능 구현 중
- 베타: `0.1.0-beta.N` - 기능 완성, 안정화 진행 중
- 정식: `0.1.0` - 베타 종료, 안정화 완료

**커밋 시 필수 작업**:
1. `VERSION` 파일 버전 증가
2. package.json 파일들에 동기화
3. 커밋 메시지에 `(v버전)` 태그 포함

```bash
# 버전 증가 예시
NEW_VERSION="0.1.0-alpha.2"
echo "$NEW_VERSION" > VERSION
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json apps/*/package.json

# 커밋 예시
git commit -m "feat: Task CRUD API 구현 (v0.1.0-alpha.2)"
```

## 개발 환경

### 로컬 개발 실행
```bash
# Backend (Flask)
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run --port 4001

# Frontend (React + Vite)
cd apps/frontend
npm install
npm run dev  # 또는 pnpm dev
```

### Docker 실행 (권장)
```bash
cd infra/docker
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
```

### 포트 설정
- **Frontend**: `3001` (미시시피/CTEM과 충돌 방지)
- **Backend**: `4001` (미시시피/CTEM과 충돌 방지)
- **MariaDB**: `3307` (기본 3306과 충돌 방지)
- **Redis**: `6380` (기본 6379와 충돌 방지)

### 주요 환경 변수
```bash
# Database (MariaDB)
DB_HOST=localhost
DB_PORT=3307
DB_NAME=msspbiz
DB_USER=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=your_redis_password

# Flask
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your_secret_key

# JWT
JWT_SECRET_KEY=your_jwt_secret
JWT_ACCESS_TOKEN_EXPIRES=3600  # 1시간
JWT_REFRESH_TOKEN_EXPIRES=604800  # 7일

# 계약 금액 암호화
CONTRACT_ENCRYPTION_KEY=your_32_char_encryption_key

# CORS (미시시피 SSO 연동용)
CORS_ORIGINS=https://mssp.leaked.id,http://localhost:3001
```

## Claude Code 권한 설정 (자동화)

**에이전트 자동 작업을 위한 권한 설정**: 중간 승인 없이 에이전트끼리 작업 진행

### 설정 파일 생성

```bash
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'EOF'
{
  "permissionMode": "auto",
  "autoApprove": {
    "Bash": {
      "enabled": true,
      "prompts": [
        "run tests",
        "install dependencies",
        "build project",
        "start development server",
        "git operations",
        "database migrations",
        "run linter",
        "format code",
        "npm install",
        "pip install",
        "docker compose",
        "flask db migrate",
        "pytest",
        "npm run build",
        "version update"
      ]
    },
    "Read": { "enabled": true },
    "Write": { "enabled": true },
    "Edit": { "enabled": true },
    "Glob": { "enabled": true },
    "Grep": { "enabled": true },
    "Task": { "enabled": true },
    "TodoWrite": { "enabled": true },
    "NotebookEdit": { "enabled": true }
  }
}
EOF
```

### 자동 승인 범위

**✅ 자동 승인 도구**:
- **파일 작업**: Read, Write, Edit, Glob, Grep
- **Task**: 서브에이전트 호출 (PM → Backend/Frontend/QA 등)
- **TodoWrite**: 작업 목록 관리
- **Bash**: 테스트, 빌드, 패키지 설치, Git 작업, DB 마이그레이션 등

**⚠️ 여전히 확인 필요**:
- `git push` (원격 저장소 변경)
- `rm -rf` (파일 삭제)
- `docker` 명령 (인프라 변경)
- 위험한 작업

### 적용 방법

1. 위 설정 파일 생성
2. **Claude Code 재시작**
3. 이후 "서연, Task CRUD 구현해줘" 같은 요청 시 **자동으로 병렬 작업 진행**

### 효과

- 중간 승인 클릭 제거
- PM이 작업 분배 → 서브에이전트 자동 실행
- 최종 결과만 보고

## 멀티테넌시 및 보안

- 모든 데이터는 `tenant_id`로 격리
- JWT에 `tenantId` 포함
- 계약 금액은 AES-256-GCM 암호화 저장
- 역할별 접근 권한 (Owner/Admin/Editor/Analyst/Viewer)

## React 무한 루프/토스트 폭탄 방지

**useCallback 의존성 주의**:
```tsx
// ❌ 잘못된 예 - toast, t 등은 매 렌더마다 새 참조
const fetchData = useCallback(async () => {
  toast.error(t('error'));
}, [toast, t]); // 무한 루프!

// ✅ 올바른 예 - 실제 변경되는 값만 의존성에
const fetchData = useCallback(async () => {
  console.error('Failed to fetch');
}, [weekFilter]);
```

**useEffect 의존성 주의**:
```tsx
// ❌ 객체/배열 직접 의존
useEffect(() => { ... }, [{ a: 1 }]); // 매번 새 객체!

// ✅ 원시값 사용
useEffect(() => { ... }, [a]);
```

## 서브에이전트 운영 지침

### 호칭 규칙
- **사용자(PO)**: "캡틴"으로 호칭 (Product Owner, 최종 의사결정권자)
- **PM(박서연)**: 이름 또는 "PM"으로 호칭 (태스크 조율 담당)

### 페르소나

| 역할 | 이름 | 담당 |
|------|------|------|
| PM | 박서연 | 요구사항 정의, 태스크 분배, 병렬 작업 조율 |
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

**병렬 실행 가능**:
- 버그 수정 + 문서 업데이트
- Backend 수정 + Frontend 수정 (API 스펙 동일 시)
- 코드 작성 + 테스트 코드 작성
- 기능 구현 + 릴리스 노트 작성

**병렬 불가**:
- 순차 의존성이 있는 작업 (DB 스키마 → Entity → Service → Controller)
- 이전 결과에 따라 다음 작업이 결정되는 경우
- 동일 파일 수정

## 문서 구조

```
docs/
├── design/
│   └── planning.md      # 전체 기획, DB 스키마, API 설계 (v1.0)
├── user-guide/          # 사용자 매뉴얼
├── admin-guide/         # 관리자 매뉴얼
├── api/                 # API 문서
├── deployment/          # 배포 가이드
├── release-notes/       # 릴리스 노트
└── images/              # 스크린샷, 다이어그램
```

## 프로젝트 구조 (Flask)

```
apps/backend/
├── app/
│   ├── __init__.py          # Flask app 초기화
│   ├── config.py            # 환경별 설정
│   ├── extensions.py        # SQLAlchemy, JWT, CORS 등
│   ├── models/              # SQLAlchemy 모델
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── meeting.py
│   │   └── contract.py
│   ├── api/                 # Flask Blueprint (API)
│   │   ├── __init__.py
│   │   ├── auth.py          # 인증 (/api/auth/*)
│   │   ├── tasks.py         # Task CRUD
│   │   ├── meetings.py      # 회의록 CRUD
│   │   └── contracts.py     # 계약 CRUD
│   ├── services/            # 비즈니스 로직
│   ├── schemas/             # Marshmallow 스키마
│   └── utils/               # 유틸리티 (암호화 등)
├── migrations/              # Alembic 마이그레이션
├── tests/
├── requirements.txt
└── run.py

apps/frontend/
├── src/
│   ├── pages/               # React 페이지
│   │   ├── Login.jsx
│   │   ├── Tasks/
│   │   ├── Meetings/
│   │   └── Contracts/
│   ├── components/          # 재사용 컴포넌트
│   ├── context/             # Context API
│   ├── services/            # API 호출 (axios)
│   └── utils/
├── vite.config.js
└── package.json
```

## 관련 프로젝트

- **미시시피**: https://mssp.leaked.id - 기존 MSSP 업무포털 (SSO 통합 대상)
- **CTEM**: `/home/wynne/othaisan/CTEM/` - 보안 위협 관리 플랫폼 (참고용)

## 참고

- **상세 기획**: [docs/design/planning.md](docs/design/planning.md)
- **프로젝트 소개**: [README.md](README.md)
- **현재 버전**: [VERSION](VERSION)
