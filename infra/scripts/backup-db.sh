#!/bin/bash
# MsspBizCenter PostgreSQL 백업 스크립트
# 사용법: bash infra/scripts/backup-db.sh [--retain-days N]

set -euo pipefail

# 설정
CONTAINER_NAME="${DB_CONTAINER:-msspbiz-postgres-dev}"
DB_USER="${DB_USERNAME:-msspbiz}"
DB_NAME="${DB_DATABASE:-msspbiz}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../../backups}"
RETAIN_DAYS="${1:-7}"

# --retain-days 파싱
if [[ "${1:-}" == "--retain-days" ]]; then
  RETAIN_DAYS="${2:-7}"
fi

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/msspbiz_${TIMESTAMP}.sql"

echo "=== MsspBizCenter DB Backup ==="
echo "Container: $CONTAINER_NAME"
echo "Database:  $DB_NAME"
echo "Output:    $BACKUP_FILE"
echo ""

# Docker 컨테이너 실행 확인
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "ERROR: Container '$CONTAINER_NAME' is not running."
  exit 1
fi

# pg_dump 실행
echo "Backing up database..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl > "$BACKUP_FILE"

# 결과 확인
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup completed: $BACKUP_FILE ($FILE_SIZE)"

# 오래된 백업 삭제
if [[ "$RETAIN_DAYS" -gt 0 ]]; then
  DELETED=$(find "$BACKUP_DIR" -name "msspbiz_*.sql" -mtime +"$RETAIN_DAYS" -delete -print | wc -l)
  if [[ "$DELETED" -gt 0 ]]; then
    echo "Cleaned up $DELETED old backup(s) (older than ${RETAIN_DAYS} days)"
  fi
fi

echo "=== Done ==="
