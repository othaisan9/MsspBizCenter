# MsspBizCenter Docker 개발 환경

PostgreSQL + Redis 기반 개발 환경 구성

## 사용법

### 1. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열어서 비밀번호 변경
```

**필수 수정 항목:**
- `DB_PASSWORD`: PostgreSQL 비밀번호
- `REDIS_PASSWORD`: Redis 비밀번호
- `JWT_SECRET`: JWT 토큰 시크릿 (32자 이상 권장)
- `JWT_REFRESH_SECRET`: JWT 리프레시 토큰 시크릿
- `CONTRACT_ENCRYPTION_KEY`: 계약 금액 암호화 키 (최소 32자)

### 2. Docker 컨테이너 실행

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 3. 상태 확인

```bash
docker compose -f docker-compose.dev.yml ps
```

**예상 출력:**
```
NAME                     IMAGE                 STATUS         PORTS
msspbiz-postgres-dev     postgres:16-alpine    Up (healthy)   0.0.0.0:5433->5432/tcp
msspbiz-redis-dev        redis:7-alpine        Up (healthy)   127.0.0.1:6380->6379/tcp
msspbiz-backend-dev      (NestJS)              Up             0.0.0.0:4001->4001/tcp
msspbiz-frontend-dev     (Next.js)             Up             0.0.0.0:3001->3001/tcp
```

### 4. 중지

```bash
docker compose -f docker-compose.dev.yml down
```

### 5. 데이터 삭제 (주의!)

```bash
# 볼륨까지 모두 삭제 (DB 데이터 손실!)
docker compose -f docker-compose.dev.yml down -v
```

## 접속 정보

| 서비스 | 호스트 | 포트 | 비고 |
|--------|--------|------|------|
| Frontend (Next.js) | localhost | 3001 | Next.js 개발 서버 (HMR) |
| Backend (NestJS) | localhost | 4001 | NestJS API 서버 |
| PostgreSQL | localhost | 5433 | 내부: 5432 |
| Redis | localhost | 6380 | 내부: 6379, 127.0.0.1만 바인딩 |

**접속 URL:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:4001/api/v1
- Backend Health: http://localhost:4001/health
- Swagger API Docs: http://localhost:4001/api

**포트 변경 이유:**
- CTEM 프로젝트와 포트 충돌 방지
  - CTEM: 3000 (Frontend), 4000 (Backend), 5432 (PostgreSQL), 6379 (Redis)
  - MsspBiz: 3001 (Frontend), 4001 (Backend), 5433 (PostgreSQL), 6380 (Redis)

## 빠른 테스트

전체 환경을 한번에 테스트하려면:

```bash
./test-connection.sh
```

**출력 예시:**
```
===================================
MsspBizCenter 연결 테스트
===================================

1. 컨테이너 상태 확인
2. PostgreSQL 연결 테스트
3. Redis 연결 테스트
4. 헬스체크 상태
5. 포트 바인딩

✅ 모든 테스트 통과!
```

## 접속 테스트

### PostgreSQL 접속

```bash
# Docker 컨테이너 내부에서 접속
docker exec -it msspbiz-postgres-dev psql -U msspbiz -d msspbiz

# 또는 로컬 PostgreSQL 클라이언트 사용
psql -h localhost -p 5433 -U msspbiz -d msspbiz
# Password: .env 파일의 DB_PASSWORD 입력
```

**기본 쿼리:**
```sql
\l              -- 데이터베이스 목록
\c msspbiz      -- msspbiz 데이터베이스로 전환
\dt             -- 테이블 목록
\d+ table_name  -- 테이블 상세 정보
```

### Redis 접속

```bash
# Docker 컨테이너 내부에서 접속
docker exec -it msspbiz-redis-dev redis-cli -a <REDIS_PASSWORD>

# 또는 로컬 Redis 클라이언트 사용
redis-cli -h 127.0.0.1 -p 6380 -a <REDIS_PASSWORD>
```

**기본 명령:**
```bash
PING           # PONG 응답 확인
INFO           # Redis 정보
KEYS *         # 모든 키 조회
```

## 로그 확인

### 전체 로그

```bash
docker compose -f docker-compose.dev.yml logs -f
```

### PostgreSQL 로그

```bash
docker compose -f docker-compose.dev.yml logs -f postgres
```

### Redis 로그

```bash
docker compose -f docker-compose.dev.yml logs -f redis
```

### Backend 로그

```bash
docker compose -f docker-compose.dev.yml logs -f backend
```

### Frontend 로그

```bash
docker compose -f docker-compose.dev.yml logs -f frontend
```

## 헬스체크

### PostgreSQL 헬스체크

```bash
docker exec msspbiz-postgres-dev pg_isready -U msspbiz -d msspbiz
echo $?  # 0이면 정상
```

### Redis 헬스체크

```bash
docker exec msspbiz-redis-dev redis-cli -a <REDIS_PASSWORD> ping
# PONG 응답 확인
```

## 데이터 볼륨 위치

```bash
# 볼륨 목록 확인
docker volume ls | grep msspbiz

# 볼륨 상세 정보
docker volume inspect docker_postgres_data
docker volume inspect docker_redis_data
```

## 트러블슈팅

### 1. 포트 충돌

**증상:**
```
Error: bind: address already in use
```

**해결:**
```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :5433
sudo lsof -i :6380

# 프로세스 종료 또는 docker-compose.dev.yml의 포트 변경
```

### 2. 헬스체크 실패

**증상:**
```
msspbiz-postgres-dev is unhealthy
```

**해결:**
```bash
# 로그 확인
docker compose -f docker-compose.dev.yml logs postgres

# 컨테이너 재시작
docker compose -f docker-compose.dev.yml restart postgres
```

### 3. 권한 오류

**증상:**
```
password authentication failed for user "msspbiz"
```

**해결:**
```bash
# 컨테이너 완전 재시작
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d

# 또는 postgres 계정으로 접속 후 권한 확인
docker exec -it msspbiz-postgres-dev psql -U postgres
\du  -- 사용자 목록 확인
```

### 4. Redis 연결 오류

**증상:**
```
NOAUTH Authentication required
```

**해결:**
```bash
# 비밀번호 확인
cat .env | grep REDIS_PASSWORD

# 비밀번호와 함께 접속
docker exec -it msspbiz-redis-dev redis-cli -a <REDIS_PASSWORD>
```

### 5. Backend 시작 실패

**증상:**
```
Error: Cannot find module '@nestjs/core'
```

**해결:**
```bash
# 컨테이너 재빌드
docker compose -f docker-compose.dev.yml build --no-cache backend
docker compose -f docker-compose.dev.yml up -d backend
```

## PostgreSQL 설정

### 문자셋

- 기본 인코딩: `UTF8`
- 이모지 지원

### 성능 설정

| 파라미터 | 값 | 설명 |
|----------|-----|------|
| max_connections | 200 | 최대 연결 수 |
| shared_buffers | 256MB | 공유 버퍼 크기 |

### 타임존

- 기본 타임존: `Asia/Seoul`

## Redis 설정

### 메모리 정책

| 파라미터 | 값 | 설명 |
|----------|-----|------|
| maxmemory | 256mb | 최대 메모리 |
| maxmemory-policy | allkeys-lru | 메모리 부족 시 LRU 정책 |

### 영속성

- AOF (Append Only File) 활성화
- 데이터 영속성 보장

## Backend/Frontend 서비스

### Backend (NestJS)

- **위치**: `apps/backend/Dockerfile.dev`
- **기술 스택**: Node.js + NestJS + TypeScript
- **개발 서버**: NestJS 개발 서버 (hot reload)
- **컨테이너 접속**: `docker exec -it msspbiz-backend-dev /bin/sh`

**컨테이너 내부 명령:**
```bash
# NestJS CLI
npm run start:dev

# DB 마이그레이션
npm run migration:generate -- src/migrations/InitialMigration
npm run migration:run

# 테스트
npm run test
npm run test:e2e

# 빌드
npm run build
```

### Frontend (Next.js)

- **위치**: `apps/frontend/Dockerfile.dev`
- **기술 스택**: React 19 + Next.js + TypeScript
- **개발 서버**: Next.js 개발 서버 (HMR)
- **컨테이너 접속**: `docker exec -it msspbiz-frontend-dev /bin/sh`

**컨테이너 내부 명령:**
```bash
# 패키지 설치
npm install

# 빌드
npm run build

# 테스트
npm run test
```

## 참고

- **CTEM과 포트 충돌 방지**: 5433, 6380 사용
- **보안**: Redis는 127.0.0.1만 바인딩 (외부 접속 차단)
- **데이터 보존**: 볼륨 사용으로 컨테이너 재시작 시에도 데이터 유지
- **헬스체크**: 자동 복구 및 상태 모니터링
