# MsspBizCenter Docker 개발 환경

## 개요

MsspBizCenter의 Docker 기반 개발 환경입니다. **핫리로드(Hot Reload)** 방식으로 설정되어 있어, 소스 코드를 수정하면 컨테이너 재시작 없이 자동으로 반영됩니다.

## 구성 요소

- **PostgreSQL 16**: 메인 데이터베이스 (포트 5433)
- **Redis 7**: 캐시 및 세션 스토어 (포트 6380)
- **Backend (NestJS)**: API 서버 (포트 4001)
- **Frontend (Next.js)**: 웹 UI (포트 3001)

> **주의**: CTEM 프로젝트와 포트 충돌을 방지하기 위해 다른 포트를 사용합니다.

## 빠른 시작

### 1. 환경 변수 설정

```bash
cd /home/wynne/othaisan/MsspBizCenter/infra/docker
cp .env.example .env
```

`.env` 파일을 열어 필요한 값을 수정합니다 (특히 비밀번호와 시크릿 키).

**필수 수정 항목**:
- `DB_PASSWORD`: PostgreSQL 비밀번호
- `REDIS_PASSWORD`: Redis 비밀번호
- `JWT_SECRET`: JWT 토큰 시크릿 (32자 이상)
- `JWT_REFRESH_SECRET`: JWT 리프레시 토큰 시크릿 (32자 이상)
- `CONTRACT_ENCRYPTION_KEY`: 계약 금액 암호화 키 (정확히 32자)

### 2. Docker Compose 실행

```bash
# 전체 스택 실행 (빌드 + 시작)
docker compose -f docker-compose.dev.yml up -d --build

# 로그 확인
docker compose -f docker-compose.dev.yml logs -f

# 특정 서비스 로그만 보기
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

### 3. 접속

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:4001
- **Swagger API Docs**: http://localhost:4001/api/docs

## 핫리로드 동작 방식

### Backend (NestJS)

- **마운트 경로**:
  - `apps/backend/src` → 소스 코드
  - `packages/shared/src` → 공유 패키지
  - `uploads` → 업로드 파일 (영속)

- **자동 반영**: `nest start --watch` 모드로 실행되어 파일 수정 시 자동 재시작

- **예시**:
  ```bash
  # 1. 호스트에서 파일 수정
  vim /home/wynne/othaisan/MsspBizCenter/apps/backend/src/app.controller.ts

  # 2. 저장하면 자동으로 컨테이너 내부에서 감지
  # 3. NestJS가 자동으로 재컴파일
  # 4. 브라우저 새로고침하면 반영됨
  ```

### Frontend (Next.js)

- **마운트 경로**:
  - `apps/frontend/src` → 소스 코드
  - `apps/frontend/public` → 정적 파일
  - `packages/shared/src` → 공유 패키지

- **환경 변수**:
  - `WATCHPACK_POLLING=true`: Docker에서 파일 변경 감지
  - `CHOKIDAR_USEPOLLING=true`: 파일 시스템 polling 활성화

- **자동 반영**: Next.js Fast Refresh로 브라우저 자동 새로고침

- **예시**:
  ```bash
  # 1. 호스트에서 파일 수정
  vim /home/wynne/othaisan/MsspBizCenter/apps/frontend/src/app/page.tsx

  # 2. 저장하면 자동으로 컨테이너 내부에서 감지
  # 3. Next.js Fast Refresh가 자동으로 브라우저 새로고침
  ```

### Shared 패키지 수정

공유 패키지(`@msspbiz/shared`)를 수정하면:

```bash
# 1. 호스트에서 shared 패키지 수정
vim /home/wynne/othaisan/MsspBizCenter/packages/shared/src/index.ts

# 2. 컨테이너 내부에서 shared 재빌드 필요
docker exec -it msspbiz-backend-dev pnpm --filter @msspbiz/shared build

# 3. Backend/Frontend가 자동으로 변경사항 감지
```

## 주요 명령어

### 컨테이너 관리

```bash
# 전체 시작
docker compose -f docker-compose.dev.yml up -d

# 전체 중지
docker compose -f docker-compose.dev.yml down

# 전체 중지 + 볼륨 삭제 (데이터베이스 초기화)
docker compose -f docker-compose.dev.yml down -v

# 특정 서비스만 재시작
docker compose -f docker-compose.dev.yml restart backend
docker compose -f docker-compose.dev.yml restart frontend

# 이미지 재빌드
docker compose -f docker-compose.dev.yml build --no-cache

# 전체 재빌드 + 시작
docker compose -f docker-compose.dev.yml up -d --build --force-recreate
```

### 로그 확인

```bash
# 전체 로그
docker compose -f docker-compose.dev.yml logs -f

# 특정 서비스 로그
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml logs -f redis

# 최근 100줄만 보기
docker compose -f docker-compose.dev.yml logs --tail=100 backend
```

### 컨테이너 내부 접속

```bash
# Backend 컨테이너 접속
docker exec -it msspbiz-backend-dev sh

# Frontend 컨테이너 접속
docker exec -it msspbiz-frontend-dev sh

# PostgreSQL 접속
docker exec -it msspbiz-postgres-dev psql -U msspbiz -d msspbiz

# Redis 접속
docker exec -it msspbiz-redis-dev redis-cli -a dev-redis-password
```

### 데이터베이스 관리

```bash
# PostgreSQL 백업
docker exec msspbiz-postgres-dev pg_dump -U msspbiz msspbiz > backup.sql

# PostgreSQL 복원
docker exec -i msspbiz-postgres-dev psql -U msspbiz msspbiz < backup.sql

# 데이터베이스 초기화 (주의: 모든 데이터 삭제!)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

## 트러블슈팅

### 1. 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3001
sudo lsof -i :4001
sudo lsof -i :5433
sudo lsof -i :6380

# 프로세스 종료
kill -9 <PID>
```

### 2. 컨테이너 시작 실패

```bash
# 기존 컨테이너 및 볼륨 삭제 후 재시작
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build
```

### 3. 핫리로드가 작동하지 않음

**Backend**:
```bash
# 컨테이너 재시작
docker compose -f docker-compose.dev.yml restart backend

# 로그 확인
docker compose -f docker-compose.dev.yml logs -f backend

# Volume 마운트 확인
docker inspect msspbiz-backend-dev | grep -A 20 Mounts
```

**Frontend**:
```bash
# 컨테이너 재시작
docker compose -f docker-compose.dev.yml restart frontend

# 환경 변수 확인 (WATCHPACK_POLLING=true 있어야 함)
docker exec msspbiz-frontend-dev env | grep WATCH

# 로그 확인
docker compose -f docker-compose.dev.yml logs -f frontend
```

### 4. 의존성 문제

```bash
# 이미지 재빌드 (캐시 없이)
docker compose -f docker-compose.dev.yml build --no-cache

# 컨테이너 내부에서 의존성 재설치
docker exec -it msspbiz-backend-dev pnpm install
docker exec -it msspbiz-frontend-dev pnpm install

# shared 패키지 재빌드
docker exec -it msspbiz-backend-dev pnpm --filter @msspbiz/shared build
```

### 5. 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
docker compose -f docker-compose.dev.yml ps postgres

# 헬스체크 확인
docker inspect msspbiz-postgres-dev | grep -A 10 Health

# 직접 연결 테스트
docker exec -it msspbiz-postgres-dev psql -U msspbiz -d msspbiz -c "SELECT 1"
```

### 6. 파일 권한 문제 (Linux/macOS)

```bash
# uploads 디렉토리 권한 설정
mkdir -p /home/wynne/othaisan/MsspBizCenter/uploads
chmod 777 /home/wynne/othaisan/MsspBizCenter/uploads
```

## 성능 최적화

### 1. Volume 마운트 최적화

현재 설정은 성능을 위해 다음과 같이 구성되어 있습니다:

- **소스 코드만 마운트**: 핫리로드에 필요한 파일만
- **node_modules는 컨테이너 내부 사용**: Anonymous volume으로 성능 향상
- **빌드 결과는 컨테이너 내부 사용**: dist, .next 등

```yaml
volumes:
  # ✅ 마운트: 소스 코드 (핫리로드용)
  - ../../apps/backend/src:/app/apps/backend/src

  # ❌ 마운트 안함: node_modules (성능 이슈)
  - /app/node_modules

  # ❌ 마운트 안함: 빌드 결과 (성능 이슈)
  - /app/apps/backend/dist
```

### 2. Docker Desktop 설정 (macOS/Windows)

Docker Desktop 사용 시 성능 개선:

- **File Sharing**: 필요한 디렉토리만 추가
- **Resources**: CPU/메모리 충분히 할당 (최소 4GB RAM, 권장 8GB)
- **Enable VirtioFS** (macOS): 파일 시스템 성능 향상

### 3. WSL2 사용 (Windows)

Windows에서는 WSL2 백엔드 사용 권장:

```bash
wsl --set-default-version 2
```

## 보안 주의사항

### 1. 환경 변수

- `.env` 파일은 절대 Git에 커밋하지 마세요
- 프로덕션에서는 반드시 모든 시크릿 키를 변경하세요
- `CONTRACT_ENCRYPTION_KEY`는 정확히 32자여야 합니다

```bash
# 안전한 시크릿 키 생성
openssl rand -base64 32
openssl rand -hex 16
```

### 2. 포트 노출

- Redis는 `127.0.0.1:6380`으로만 노출 (외부 접속 차단)
- PostgreSQL은 개발 환경에서만 `5433` 포트 노출
- 프로덕션에서는 Reverse Proxy(Nginx) 사용 권장

### 3. 기본 관리자 계정

- 첫 실행 시 기본 관리자 계정이 생성됩니다
- `.env`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD`를 반드시 변경하세요
- 프로덕션 배포 전에 비밀번호를 강력하게 변경하세요

## 개발 워크플로우

### 1. 일반적인 개발 흐름

```bash
# 1. Docker 환경 시작
cd /home/wynne/othaisan/MsspBizCenter/infra/docker
docker compose -f docker-compose.dev.yml up -d

# 2. 로그 모니터링 (선택)
docker compose -f docker-compose.dev.yml logs -f

# 3. 코드 수정 (호스트에서)
# - apps/backend/src/ 에서 Backend 수정
# - apps/frontend/src/ 에서 Frontend 수정
# - 자동으로 컨테이너에 반영됨!

# 4. 작업 완료 후 중지
docker compose -f docker-compose.dev.yml down
```

### 2. 패키지 추가

**Backend**:
```bash
# 호스트에서 실행
cd /home/wynne/othaisan/MsspBizCenter
pnpm --filter @msspbiz/backend add <package-name>

# 컨테이너 재빌드
cd infra/docker
docker compose -f docker-compose.dev.yml build backend
docker compose -f docker-compose.dev.yml up -d backend
```

**Frontend**:
```bash
# 호스트에서 실행
cd /home/wynne/othaisan/MsspBizCenter
pnpm --filter @msspbiz/frontend add <package-name>

# 컨테이너 재빌드
cd infra/docker
docker compose -f docker-compose.dev.yml build frontend
docker compose -f docker-compose.dev.yml up -d frontend
```

### 3. 데이터베이스 마이그레이션

```bash
# 컨테이너 내부에서 실행
docker exec -it msspbiz-backend-dev sh

# 마이그레이션 생성
pnpm --filter @msspbiz/backend run typeorm migration:generate -- -n MigrationName

# 마이그레이션 실행
pnpm --filter @msspbiz/backend run typeorm migration:run

# 마이그레이션 되돌리기
pnpm --filter @msspbiz/backend run typeorm migration:revert

exit
```

## 루트 디렉토리에서 편리하게 사용

프로젝트 루트에 이미 다음 스크립트가 있습니다:

```bash
# 시작
pnpm docker:up

# 중지
pnpm docker:down
```

또는 직접 스크립트 추가:

```json
// package.json
{
  "scripts": {
    "docker:up": "docker compose -f infra/docker/docker-compose.dev.yml up -d",
    "docker:down": "docker compose -f infra/docker/docker-compose.dev.yml down",
    "docker:logs": "docker compose -f infra/docker/docker-compose.dev.yml logs -f",
    "docker:rebuild": "docker compose -f infra/docker/docker-compose.dev.yml up -d --build --force-recreate"
  }
}
```

## 접속 정보

| 서비스 | 호스트 | 포트 | 컨테이너 내부 |
|--------|--------|------|--------------|
| Frontend | localhost | 3001 | - |
| Backend | localhost | 4001 | backend:4001 |
| PostgreSQL | localhost | 5433 | postgres:5432 |
| Redis | 127.0.0.1 | 6380 | redis:6379 |

**접속 URL**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:4001/api/v1
- Backend Health: http://localhost:4001/health
- Swagger API Docs: http://localhost:4001/api/docs

**포트 변경 이유**:
- CTEM 프로젝트와 포트 충돌 방지
  - CTEM: 3000 (Frontend), 4000 (Backend), 5432 (PostgreSQL), 6379 (Redis)
  - MsspBiz: 3001 (Frontend), 4001 (Backend), 5433 (PostgreSQL), 6380 (Redis)

## 헬스체크

### PostgreSQL

```bash
# Docker healthcheck
docker inspect msspbiz-postgres-dev | grep -A 5 Health

# 수동 확인
docker exec msspbiz-postgres-dev pg_isready -U msspbiz -d msspbiz
```

### Redis

```bash
# Docker healthcheck
docker inspect msspbiz-redis-dev | grep -A 5 Health

# 수동 확인
docker exec msspbiz-redis-dev redis-cli -a dev-redis-password ping
```

## 데이터 볼륨

```bash
# 볼륨 목록 확인
docker volume ls | grep msspbiz

# 볼륨 상세 정보
docker volume inspect docker_postgres_data
docker volume inspect docker_redis_data

# 볼륨 삭제 (주의: 데이터 손실!)
docker volume rm docker_postgres_data
docker volume rm docker_redis_data
```

## 참고 자료

- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Redis 공식 문서](https://redis.io/docs/)
- [pnpm 공식 문서](https://pnpm.io/)
- [Turborepo 공식 문서](https://turbo.build/repo/docs)

## FAQ

### Q1. 핫리로드가 작동하지 않아요

**A**: 다음을 확인하세요:
1. Volume 마운트가 올바른지 확인
2. Frontend의 경우 `WATCHPACK_POLLING=true` 환경 변수 확인
3. 컨테이너 로그 확인
4. 파일 권한 확인 (Linux/macOS)

### Q2. node_modules를 수정했는데 반영이 안돼요

**A**: node_modules는 Anonymous Volume으로 마운트되어 있어 호스트와 공유되지 않습니다. 패키지를 추가/수정했다면 **`-V` 플래그**로 anonymous volume을 재생성해야 합니다:

```bash
# -V 플래그: anonymous volume 재생성 (stale node_modules 방지)
docker compose -f docker-compose.dev.yml up -d -V --build backend

# 또는 전체 재빌드
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

> **주의**: `-V` 없이 `up -d`만 실행하면 기존 anonymous volume의 오래된 node_modules가 유지되어 새로 추가한 패키지를 찾지 못합니다.

### Q3. shared 패키지 변경이 반영 안돼요

**A**: shared 패키지를 수정한 후 재빌드가 필요합니다:

```bash
docker exec -it msspbiz-backend-dev pnpm --filter @msspbiz/shared build
```

### Q4. 데이터베이스 데이터가 사라졌어요

**A**: `docker compose down -v` 명령을 실행하면 볼륨이 삭제되어 데이터가 손실됩니다. 데이터를 유지하려면 `-v` 옵션 없이 실행하세요.

### Q5. 포트를 변경하고 싶어요

**A**: `docker-compose.dev.yml`에서 포트 매핑을 변경하세요:

```yaml
ports:
  - "새포트:컨테이너포트"
```

변경 후 컨테이너를 재시작하세요.

## 문의

문제가 발생하면 다음을 확인하세요:

1. `.env` 파일이 올바르게 설정되었는지
2. Docker Desktop이 실행 중인지
3. 포트가 다른 프로세스에 의해 사용되고 있지 않은지
4. 컨테이너 로그에 에러가 있는지

이슈가 지속되면 프로젝트 관리자에게 문의하세요.
