# Flask Backend 구현 현황 (v0.1.0-alpha.2)

**작성일**: 2026-02-07
**담당자**: 박안도 (Backend)
**상태**: 기본 구조 완료, 실행 가능

## 구현 완료 항목

### 1. 프로젝트 구조

```
apps/backend/
├── app/
│   ├── __init__.py          # Flask app factory ✅
│   ├── config.py            # 환경별 설정 (Dev/Prod/Test) ✅
│   ├── extensions.py        # SQLAlchemy, JWT, Migrate ✅
│   ├── models/              # 데이터 모델 ✅
│   │   ├── base.py          # BaseModel (tenant_id, timestamps)
│   │   ├── user.py          # User 모델 (인증, 역할)
│   │   ├── task.py          # Task, TaskComment
│   │   ├── meeting.py       # Meeting, MeetingAttendee, ActionItem
│   │   └── contract.py      # Contract, ContractHistory
│   ├── api/                 # REST API ✅
│   │   ├── auth.py          # 인증 (login, register, refresh, me)
│   │   ├── tasks.py         # Task CRUD
│   │   ├── meetings.py      # Meeting CRUD
│   │   └── contracts.py     # Contract CRUD (암호화)
│   ├── schemas/             # Marshmallow 스키마 ✅
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── meeting.py
│   │   └── contract.py
│   ├── services/            # 비즈니스 로직 ✅
│   │   └── encryption.py    # AES-256-GCM 암호화
│   └── utils/               # 유틸리티 ✅
│       └── decorators.py    # tenant_required, role_required
├── tests/                   # 테스트 ✅
│   ├── conftest.py          # Pytest 설정
│   └── __init__.py
├── requirements.txt         # Python 의존성 ✅
├── .env.example            # 환경 변수 템플릿 ✅
├── .gitignore              # Git 제외 파일 ✅
├── README.md               # 프로젝트 문서 ✅
└── run.py                  # 실행 파일 ✅
```

### 2. 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | Flask | 3.0.0 |
| ORM | SQLAlchemy | 2.0.46 |
| DB Migration | Flask-Migrate (Alembic) | 4.0.5 |
| Authentication | Flask-JWT-Extended | 4.6.0 |
| API Documentation | Flask-RESTX (Swagger) | 1.3.0 |
| Validation | Marshmallow | 3.20.1 |
| CORS | Flask-CORS | 4.0.0 |
| Encryption | cryptography (AES-256-GCM) | 41.0.7 |
| Database | MariaDB (PyMySQL) / SQLite | - |

### 3. 구현된 API 엔드포인트

#### Auth (`/api/v1/auth`)

- ✅ `POST /login` - 사용자 로그인 (JWT 발급)
- ✅ `POST /register` - 사용자 등록
- ✅ `POST /refresh` - Access Token 갱신
- ✅ `GET /me` - 현재 사용자 정보 조회

#### Tasks (`/api/v1/tasks`)

- ✅ `GET /tasks` - Task 목록 (필터: week, year, status, assigned_to)
- ✅ `POST /tasks` - Task 생성
- ✅ `GET /tasks/<id>` - Task 상세 조회
- ✅ `PUT /tasks/<id>` - Task 수정
- ✅ `DELETE /tasks/<id>` - Task 삭제

#### Meetings (`/api/v1/meetings`)

- ✅ `GET /meetings` - Meeting 목록 (필터: status, from_date, to_date)
- ✅ `POST /meetings` - Meeting 생성
- ✅ `GET /meetings/<id>` - Meeting 상세 조회
- ✅ `PUT /meetings/<id>` - Meeting 수정
- ✅ `DELETE /meetings/<id>` - Meeting 삭제

#### Contracts (`/api/v1/contracts`)

- ✅ `GET /contracts` - Contract 목록 (Editor+ 권한 필요)
- ✅ `POST /contracts` - Contract 생성 (Admin+ 권한 필요)
- ✅ `GET /contracts/<id>` - Contract 상세 조회 (Editor+)
- ✅ `PUT /contracts/<id>` - Contract 수정 (Admin+)
- ✅ `DELETE /contracts/<id>` - Contract 삭제 (Owner 권한 필요)

### 4. 주요 기능

#### 멀티테넌시

- ✅ 모든 데이터에 `tenant_id` 컬럼 포함 (BaseModel)
- ✅ JWT 토큰에 `tenant_id` 포함
- ✅ `@tenant_required` 데코레이터로 자동 격리

#### 역할 기반 접근 제어 (RBAC)

- ✅ 5가지 역할: `owner`, `admin`, `editor`, `analyst`, `viewer`
- ✅ `@role_required('admin', 'owner')` 데코레이터
- ✅ Contract 금액 조회: Owner/Admin만 가능

#### 데이터 암호화

- ✅ AES-256-GCM 알고리즘
- ✅ Contract `amount` 필드 암호화
- ✅ 환경변수 `CONTRACT_ENCRYPTION_KEY` (최소 32자)

#### API 문서화

- ✅ Swagger UI 자동 생성
- ✅ 접속 URL: `http://localhost:4001/api/docs`
- ✅ 모든 엔드포인트 문서화 완료

### 5. 실행 테스트 결과

#### Health Check

```bash
$ curl http://localhost:4001/health
{
  "status": "healthy",
  "version": "v1"
}
```

#### 사용자 등록

```bash
$ curl -X POST http://localhost:4001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","name":"Test User","tenant_id":"test-001"}'

{
  "message": "User registered successfully",
  "user": {
    "id": 2,
    "name": "Test User",
    "role": "viewer",
    "is_active": true,
    "email": "test@example.com"
  }
}
```

#### 로그인

```bash
$ curl -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

#### Task 생성

```bash
$ curl -X POST http://localhost:4001/api/v1/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend API Development","description":"Flask REST API","status":"in_progress","priority":"high","week_number":6,"year":2026,"tags":["backend"]}'

{
  "message": "Task created successfully",
  "task": {
    "id": 2,
    "tenant_id": "test-001",
    "title": "Backend API Development",
    "status": "in_progress",
    "priority": "high",
    "week_number": 6,
    "year": 2026,
    "tags": ["backend"],
    "created_at": "2026-02-07T10:17:56.942016"
  }
}
```

#### Task 목록 조회

```bash
$ curl http://localhost:4001/api/v1/tasks \
  -H "Authorization: Bearer <token>"

{
  "tasks": [...],
  "total": 2
}
```

#### Swagger 접속

```bash
$ curl http://localhost:4001/api/docs | grep title
<title>MSSP BizCenter API</title>
```

## 미구현 항목 (향후 작업)

### 1. 데이터베이스 마이그레이션

- ⏳ Alembic 마이그레이션 초기화
- ⏳ 프로덕션 환경용 마이그레이션 스크립트

### 2. 테스트 코드

- ⏳ 단위 테스트 (pytest)
- ⏳ API 통합 테스트
- ⏳ 커버리지 80% 목표

### 3. 추가 기능

- ⏳ 감사 로그 (Audit Log) 모델 및 API
- ⏳ 알림 (Notification) 시스템
- ⏳ 대시보드 통계 API
- ⏳ 파일 업로드/다운로드
- ⏳ 페이지네이션 (Task 목록 등)

### 4. 프로덕션 준비

- ⏳ Gunicorn/uWSGI 설정
- ⏳ Docker 이미지 빌드
- ⏳ 환경 변수 검증
- ⏳ 로깅 설정 (structlog)
- ⏳ 에러 핸들링 개선

## 환경 설정

### 로컬 개발 환경

```bash
cd apps/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env 파일 수정 (DB 연결 정보 등)
python run.py
```

### 환경 변수 (.env)

```bash
FLASK_ENV=development
SECRET_KEY=dev-secret-key
DB_HOST=localhost
DB_PORT=3307
DB_NAME=msspbiz
DB_USER=root
DB_PASSWORD=password
JWT_SECRET_KEY=jwt-secret-key
CONTRACT_ENCRYPTION_KEY=your-32-character-encryption-key
USE_SQLITE=true  # 로컬 개발 시 SQLite 사용
```

### 데이터베이스

- **개발 환경**: SQLite (`msspbiz_dev.db`) - `USE_SQLITE=true` 설정 시
- **프로덕션**: MariaDB (MySQL 호환)

## 다음 단계

1. **Frontend 연동**
   - React/Vue에서 API 호출 테스트
   - CORS 설정 확인

2. **테스트 코드 작성**
   - Auth API 테스트
   - Task CRUD 테스트
   - Role-based 접근 제어 테스트

3. **감사 로그 구현**
   - 모든 중요 액션 기록
   - 90일 보존 정책 적용

4. **Docker 통합**
   - `docker-compose.dev.yml`에 Flask 서비스 추가
   - MariaDB 연동 테스트

5. **프로덕션 배포 준비**
   - Gunicorn 설정
   - Nginx 리버스 프록시
   - HTTPS 설정

## 참고 문서

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-RESTX Documentation](https://flask-restx.readthedocs.io/)
- [Flask-JWT-Extended Documentation](https://flask-jwt-extended.readthedocs.io/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## 이슈 및 해결 사항

### 1. JWT Identity 타입 문제

**문제**: Flask-JWT-Extended 4.6.0에서 identity가 dict일 때 "Subject must be a string" 오류 발생

**해결**: identity를 `str(user_id)`로 변경하고, additional_claims에 `user_id`, `tenant_id`, `role` 포함

```python
additional_claims = {
    'user_id': user.id,
    'email': user.email,
    'tenant_id': user.tenant_id,
    'role': user.role
}
access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
```

### 2. SQLAlchemy 관계 설정 오류

**문제**: User 모델의 relationship에서 multiple foreign key paths 오류

**해결**: `foreign_keys` 매개변수로 명시적 지정

```python
tasks = db.relationship('Task', foreign_keys='Task.assigned_to', backref='assignee', lazy='dynamic')
```

### 3. 데이터베이스 연결 실패 (MariaDB)

**문제**: 로컬 개발 환경에서 MariaDB 연결 실패

**해결**: SQLite fallback 설정 추가 (`USE_SQLITE=true`)

```python
if not os.getenv('DB_HOST') or os.getenv('USE_SQLITE') == 'true':
    SQLALCHEMY_DATABASE_URI = 'sqlite:///msspbiz_dev.db'
```

## 작업 완료 체크리스트

- [x] Flask 프로젝트 구조 생성
- [x] 데이터 모델 정의 (User, Task, Meeting, Contract)
- [x] REST API 엔드포인트 구현 (Auth, Tasks, Meetings, Contracts)
- [x] JWT 인증 구현
- [x] 역할 기반 접근 제어 (RBAC)
- [x] AES-256-GCM 암호화 서비스
- [x] Swagger 문서 자동 생성
- [x] 멀티테넌시 (tenant_id 기반 격리)
- [x] README 및 .env.example 작성
- [x] 실행 가능 여부 확인 (Health Check, Task CRUD)
- [x] Git 커밋 (v0.1.0-alpha.2)

---

**작성자**: 박안도 (Backend)
**검토자**: -
**승인자**: -
**버전**: v0.1.0-alpha.2
**최종 수정일**: 2026-02-07
