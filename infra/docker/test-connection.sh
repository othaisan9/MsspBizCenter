#!/bin/bash

# MsspBizCenter Docker 환경 연결 테스트 스크립트

set -e

echo "==================================="
echo "MsspBizCenter 연결 테스트"
echo "==================================="
echo ""

# 환경 변수 로드
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env 파일이 없습니다. .env.example을 복사하세요."
    exit 1
fi

# 컨테이너 상태 확인
echo "1. 컨테이너 상태 확인"
echo "-----------------------------------"
docker compose -f docker-compose.dev.yml ps
echo ""

# MariaDB 연결 테스트
echo "2. MariaDB 연결 테스트"
echo "-----------------------------------"
if docker exec msspbiz-mariadb-dev mysql -u root -p${DB_PASSWORD} -e "SELECT VERSION();" > /dev/null 2>&1; then
    VERSION=$(docker exec msspbiz-mariadb-dev mysql -u root -p${DB_PASSWORD} -e "SELECT VERSION();" 2>/dev/null | tail -n 1)
    echo "✅ MariaDB 연결 성공: $VERSION"

    # 데이터베이스 목록
    echo "   데이터베이스 목록:"
    docker exec msspbiz-mariadb-dev mysql -u root -p${DB_PASSWORD} -e "SHOW DATABASES;" 2>/dev/null | grep -v "Database" | sed 's/^/     - /'

    # 문자셋 확인
    CHARSET=$(docker exec msspbiz-mariadb-dev mysql -u root -p${DB_PASSWORD} -e "SHOW VARIABLES LIKE 'character_set_server';" 2>/dev/null | tail -n 1 | awk '{print $2}')
    echo "   문자셋: $CHARSET"

    # 사용자 확인
    USER_EXISTS=$(docker exec msspbiz-mariadb-dev mysql -u root -p${DB_PASSWORD} -e "SELECT COUNT(*) FROM mysql.user WHERE USER='${DB_USERNAME}';" 2>/dev/null | tail -n 1)
    if [ "$USER_EXISTS" -gt 0 ]; then
        echo "   사용자: ${DB_USERNAME} ✅"
    else
        echo "   사용자: ${DB_USERNAME} ❌"
    fi
else
    echo "❌ MariaDB 연결 실패"
    exit 1
fi
echo ""

# Redis 연결 테스트
echo "3. Redis 연결 테스트"
echo "-----------------------------------"
if docker exec msspbiz-redis-dev redis-cli -a ${REDIS_PASSWORD} ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis 연결 성공"

    # Redis 버전
    VERSION=$(docker exec msspbiz-redis-dev redis-cli -a ${REDIS_PASSWORD} INFO server 2>/dev/null | grep "redis_version" | cut -d: -f2 | tr -d '\r')
    echo "   버전: $VERSION"

    # 메모리 설정
    MAXMEM=$(docker exec msspbiz-redis-dev redis-cli -a ${REDIS_PASSWORD} CONFIG GET maxmemory 2>/dev/null | tail -n 1)
    MAXMEM_POLICY=$(docker exec msspbiz-redis-dev redis-cli -a ${REDIS_PASSWORD} CONFIG GET maxmemory-policy 2>/dev/null | tail -n 1)
    echo "   최대 메모리: $(($MAXMEM / 1024 / 1024))MB"
    echo "   메모리 정책: $MAXMEM_POLICY"
else
    echo "❌ Redis 연결 실패"
    exit 1
fi
echo ""

# 헬스체크 확인
echo "4. 헬스체크 상태"
echo "-----------------------------------"
MARIADB_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' msspbiz-mariadb-dev)
REDIS_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' msspbiz-redis-dev)

echo "   MariaDB: $MARIADB_HEALTH"
echo "   Redis: $REDIS_HEALTH"
echo ""

# 포트 확인
echo "5. 포트 바인딩"
echo "-----------------------------------"
echo "   MariaDB: localhost:3307 → 3306"
echo "   Redis: localhost:6380 → 6379"
echo ""

# 접속 정보
echo "==================================="
echo "접속 정보"
echo "==================================="
echo ""
echo "MariaDB:"
echo "  호스트: localhost"
echo "  포트: 3307"
echo "  데이터베이스: ${DB_DATABASE}"
echo "  사용자: ${DB_USERNAME}"
echo "  비밀번호: ${DB_PASSWORD}"
echo ""
echo "Redis:"
echo "  호스트: localhost"
echo "  포트: 6380"
echo "  비밀번호: ${REDIS_PASSWORD}"
echo ""
echo "==================================="
echo "테스트 완료!"
echo "==================================="
