# Contract 모듈 설치 가이드

## 1. 환경 설정

### 1.1 암호화 키 생성

계약 금액 암호화에 사용할 32바이트 키를 생성합니다.

```bash
# 방법 1: 제공된 스크립트 사용 (권장)
cd /home/wynne/othaisan/MsspBizCenter/apps/backend
chmod +x scripts/generate-encryption-key.js
node scripts/generate-encryption-key.js

# 방법 2: Node.js 직접 실행
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.2 환경변수 설정

생성된 키를 `.env` 파일에 추가합니다.

```bash
# .env 파일 생성 (없는 경우)
cp .env.example .env

# CONTRACT_ENCRYPTION_KEY 값 설정
# 예시:
CONTRACT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

**주의사항**:
- 키는 반드시 **64자 hex 문자열** (32바이트) 이어야 합니다
- 키를 분실하면 암호화된 금액을 복구할 수 없습니다
- 프로덕션 환경에서는 AWS Secrets Manager, HashiCorp Vault 등 사용 권장

## 2. 데이터베이스 마이그레이션

TypeORM이 자동으로 스키마를 생성하지만, 프로덕션에서는 마이그레이션을 사용합니다.

```bash
# 개발 환경 (synchronize: true)
npm run start:dev

# 프로덕션 환경 (마이그레이션 필요)
npm run typeorm migration:generate -- -n CreateContractTables
npm run typeorm migration:run
```

### 생성될 테이블

1. **contracts** - 계약 정보
2. **contract_history** - 변경 이력

### 인덱스

다음 인덱스가 자동 생성됩니다:
- `idx_contracts_tenant_status` (tenant_id, status)
- `idx_contracts_tenant_end_date` (tenant_id, end_date)
- `idx_contracts_tenant_type` (tenant_id, contract_type)

## 3. 모듈 확인

### 3.1 빌드 테스트

```bash
npm run build
```

### 3.2 서버 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run start:prod
```

### 3.3 API 문서 확인

서버 실행 후 Swagger UI 접속:

```
http://localhost:4001/api
```

"contracts" 태그 아래에 다음 엔드포인트가 표시되어야 합니다:
- POST /contracts
- GET /contracts
- GET /contracts/{id}
- PATCH /contracts/{id}
- DELETE /contracts/{id}
- PATCH /contracts/{id}/status
- POST /contracts/{id}/renew
- GET /contracts/dashboard
- GET /contracts/expiring
- GET /contracts/{id}/history

## 4. 기능 테스트

### 4.1 계약 생성

```bash
curl -X POST http://localhost:4001/api/v1/contracts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 계약",
    "contractType": "service",
    "partyA": "(주)오타이산",
    "partyB": "테스트 고객사",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "amount": 50000000,
    "currency": "KRW",
    "status": "draft"
  }'
```

### 4.2 암호화 확인

데이터베이스에서 직접 확인:

```sql
-- PostgreSQL
SELECT id, title, amount_encrypted
FROM contracts
LIMIT 1;

-- amount_encrypted 형식: iv:authTag:ciphertext (hex)
-- 예시: 4a3b2c1d...f9e8d7c6:1a2b3c4d...9e8f7a6b:5e4d3c2b...8f7e6d5c
```

### 4.3 복호화 확인

API를 통해 조회 시 자동 복호화:

```bash
curl -X GET http://localhost:4001/api/v1/contracts/{CONTRACT_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 응답에 "amount": 50000000 포함 (ADMIN 이상)
```

### 4.4 권한 테스트

**EDITOR 역할**:
```bash
# 계약 조회 성공, 하지만 amount 필드 제외됨
curl -X GET http://localhost:4001/api/v1/contracts/{CONTRACT_ID} \
  -H "Authorization: Bearer EDITOR_JWT_TOKEN"
```

**OWNER 역할**:
```bash
# 계약 삭제 성공
curl -X DELETE http://localhost:4001/api/v1/contracts/{CONTRACT_ID} \
  -H "Authorization: Bearer OWNER_JWT_TOKEN"
```

## 5. 트러블슈팅

### 문제 1: "CONTRACT_ENCRYPTION_KEY environment variable is not set"

**원인**: 환경변수 설정 안 됨

**해결**:
```bash
# .env 파일 확인
cat .env | grep CONTRACT_ENCRYPTION_KEY

# 없으면 추가
echo "CONTRACT_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
```

### 문제 2: "CONTRACT_ENCRYPTION_KEY must be 64 hex characters"

**원인**: 키 길이가 64자가 아님

**해결**:
```bash
# 새 키 생성 (정확히 64자)
node scripts/generate-encryption-key.js
```

### 문제 3: "Invalid encrypted data format"

**원인**: 암호화된 데이터 손상 또는 잘못된 키 사용

**해결**:
- 데이터베이스 백업 확인
- 올바른 키 사용 확인
- 데이터 복구 불가 시 재입력 필요

### 문제 4: TypeORM 스키마 생성 실패

**원인**: DB 연결 실패 또는 권한 문제

**해결**:
```bash
# DB 연결 확인
psql -h localhost -p 5433 -U msspbiz -d msspbiz

# 권한 확인
GRANT ALL PRIVILEGES ON DATABASE msspbiz TO msspbiz;
```

## 6. 프로덕션 배포 체크리스트

- [ ] CONTRACT_ENCRYPTION_KEY를 비밀 관리 시스템에 저장 (AWS Secrets Manager 등)
- [ ] 암호화 키 백업 (안전한 오프라인 저장소)
- [ ] DB 마이그레이션 실행 (synchronize: false)
- [ ] 인덱스 성능 확인 (EXPLAIN ANALYZE)
- [ ] 역할별 접근 제어 테스트
- [ ] 감사 로그 정상 동작 확인
- [ ] 백업/복구 절차 수립
- [ ] 만료 알림 Cron Job 설정 (향후)

## 7. 성능 최적화

### 7.1 인덱스 활용

```sql
-- 만료 예정 계약 조회 (인덱스 사용)
EXPLAIN ANALYZE
SELECT * FROM contracts
WHERE tenant_id = 'xxx'
  AND end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND status = 'active';
```

### 7.2 암호화/복호화 최적화

- 목록 조회 시: 금액 복호화 생략 (상세 조회에서만 복호화)
- 대량 데이터 처리 시: 배치 처리 고려

### 7.3 캐싱

```typescript
// Redis 캐싱 (향후 구현)
@Cacheable('contract', { ttl: 300 })
async findOne(id: string, tenantId: string) {
  // ...
}
```

## 8. 관련 문서

- [Contract 모듈 README](src/modules/contracts/README.md)
- [기획 문서](../../docs/design/planning.md)
- [CLAUDE.md](../../CLAUDE.md)

## 9. 문의

문제 발생 시:
1. 로그 확인: `tail -f logs/app.log`
2. Swagger UI에서 API 테스트
3. GitHub Issues에 버그 리포트
