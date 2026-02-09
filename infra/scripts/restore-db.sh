#!/bin/bash
# MsspBizCenter PostgreSQL 복원 스크립트
# 사용법: bash infra/scripts/restore-db.sh <backup-file.sql>

set -euo pipefail

# 설정
CONTAINER_NAME="${DB_CONTAINER:-msspbiz-postgres-dev}"
DB_USER="${DB_USERNAME:-msspbiz}"
DB_NAME="${DB_DATABASE:-msspbiz}"

# 인자 확인
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql>"
  echo ""
  echo "Available backups:"
  BACKUP_DIR="$(dirname "$0")/../../backups"
  if [[ -d "$BACKUP_DIR" ]]; then
    ls -lh "$BACKUP_DIR"/msspbiz_*.sql 2>/dev/null || echo "  (none)"
  else
    echo "  (backup directory not found)"
  fi
  exit 1
fi

BACKUP_FILE="$1"

# 파일 존재 확인
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file '$BACKUP_FILE' not found."
  exit 1
fi

# Docker 컨테이너 실행 확인
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "ERROR: Container '$CONTAINER_NAME' is not running."
  exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "=== MsspBizCenter DB Restore ==="
echo "Container: $CONTAINER_NAME"
echo "Database:  $DB_NAME"
echo "File:      $BACKUP_FILE ($FILE_SIZE)"
echo ""
echo "WARNING: This will DROP and recreate the database '$DB_NAME'."
echo "         All existing data will be replaced."
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Dropping and recreating database..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" > /dev/null 2>&1 || true

docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"

echo "Restoring from backup..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"

echo ""
echo "=== Restore completed ==="
echo "Note: Restart the backend to re-sync TypeORM if needed."
