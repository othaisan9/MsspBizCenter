# MsspBizCenter Docker 개발 환경

MariaDB + Redis 기반 개발 환경 구성

## 사용법

### 1. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열어서 비밀번호 변경
```

**필수 수정 항목:**
- `DB_PASSWORD`: MariaDB 비밀번호
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
NAME                     IMAGE             STATUS         PORTS
msspbiz-mariadb-dev      mariadb:10.11     Up (healthy)   0.0.0.0:3307->3306/tcp
msspbiz-redis-dev        redis:7-alpine    Up (healthy)   127.0.0.1:6380->6379/tcp
msspbiz-backend-dev      (Flask)           Up             0.0.0.0:4001->4001/tcp
msspbiz-frontend-dev     (React+Vite)      Up             0.0.0.0:3001->3001/tcp
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
| Frontend (React) | localhost | 3001 | Vite 개발 서버 (HMR) |
| Backend (Flask) | localhost | 4001 | Flask API 서버 |
| MariaDB | localhost | 3307 | 내부: 3306 |
| Redis | localhost | 6380 | 내부: 6379, 127.0.0.1만 바인딩 |

**접속 URL:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:4001/api/v1
- Backend Health: http://localhost:4001/health

**포트 변경 이유:**
- CTEM 프로젝트와 포트 충돌 방지
  - CTEM: 3000 (Frontend), 4000 (Backend), 3306 (DB), 6379 (Redis)
  - MsspBiz: 3001 (Frontend), 4001 (Backend), 3307 (DB), 6380 (Redis)

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
2. MariaDB 연결 테스트
3. Redis 연결 테스트
4. 헬스체크 상태
5. 포트 바인딩

✅ 모든 테스트 통과!
```

## 접속 테스트

### MariaDB 접속

```bash
# Docker 컨테이너 내부에서 접속
docker exec -it msspbiz-mariadb-dev mysql -u root -p
# Password: .env 파일의 DB_PASSWORD 입력

# 또는 로컬 MySQL 클라이언트 사용
mysql -h 127.0.0.1 -P 3307 -u msspbiz -p msspbiz
```

**기본 쿼리:**
```sql
SHOW DATABASES;
USE msspbiz;
SHOW TABLES;
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

### MariaDB 로그

```bash
docker compose -f docker-compose.dev.yml logs -f mariadb
```

### Redis 로그

```bash
docker compose -f docker-compose.dev.yml logs -f redis
```

## 헬스체크

### MariaDB 헬스체크

```bash
docker exec msspbiz-mariadb-dev healthcheck.sh --connect --innodb_initialized
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
docker volume inspect docker_mariadb_data
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
sudo lsof -i :3307
sudo lsof -i :6380

# 프로세스 종료 또는 docker-compose.dev.yml의 포트 변경
```

### 2. 헬스체크 실패

**증상:**
```
msspbiz-mariadb-dev is unhealthy
```

**해결:**
```bash
# 로그 확인
docker compose -f docker-compose.dev.yml logs mariadb

# 컨테이너 재시작
docker compose -f docker-compose.dev.yml restart mariadb
```

### 3. 권한 오류

**증상:**
```
Access denied for user 'msspbiz'@'%'
```

**해결:**
```bash
# 컨테이너 완전 재시작
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d

# 또는 root 계정으로 접속 후 권한 확인
docker exec -it msspbiz-mariadb-dev mysql -u root -p
GRANT ALL PRIVILEGES ON msspbiz.* TO 'msspbiz'@'%';
FLUSH PRIVILEGES;
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

## MariaDB 설정

### 문자셋

- 기본 문자셋: `utf8mb4`
- 콜레이션: `utf8mb4_unicode_ci`
- 이모지 지원

### 성능 설정

| 파라미터 | 값 | 설명 |
|----------|-----|------|
| max_connections | 200 | 최대 연결 수 |
| innodb_buffer_pool_size | 256M | InnoDB 버퍼 풀 크기 |

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

### Backend (Flask)

- **위치**: `apps/backend/Dockerfile.dev`
- **기술 스택**: Python 3.11 + Flask
- **개발 서버**: Flask 개발 서버 (hot reload)
- **컨테이너 접속**: `docker exec -it msspbiz-backend-dev /bin/bash`

**컨테이너 내부 명령:**
```bash
# Flask 쉘
flask shell

# DB 마이그레이션
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# 테스트
pytest
```

### Frontend (React + Vite)

- **위치**: `apps/frontend/Dockerfile.dev`
- **기술 스택**: React 19 + TypeScript + Vite
- **개발 서버**: Vite 개발 서버 (HMR)
- **컨테이너 접속**: `docker exec -it msspbiz-frontend-dev /bin/sh`

**컨테이너 내부 명령:**
```bash
# 패키지 설치
pnpm install

# 빌드
pnpm build

# 테스트
pnpm test
```

## 참고

- **CTEM과 포트 충돌 방지**: 3307, 6380 사용
- **보안**: Redis는 127.0.0.1만 바인딩 (외부 접속 차단)
- **데이터 보존**: 볼륨 사용으로 컨테이너 재시작 시에도 데이터 유지
- **헬스체크**: 자동 복구 및 상태 모니터링
