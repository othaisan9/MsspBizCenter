# Contracts Module

계약 관리 모듈 - 계약 정보 CRUD, 암호화, 만료 알림, 갱신 관리

## 기능

- ✅ 계약 CRUD (생성/조회/수정/삭제)
- ✅ 계약 금액 AES-256-GCM 암호화
- ✅ 계약 상태 관리 (draft/active/expired/terminated/renewed)
- ✅ 계약 갱신 및 이력 추적
- ✅ 만료 예정 계약 조회 (N일 이내)
- ✅ 계약 대시보드 (통계)
- ✅ 변경 이력 관리 (ContractHistory)
- ✅ 역할 기반 접근 제어 (RBAC)
  - EDITOR 이상: 계약 조회/생성/수정
  - ADMIN 이상: 계약 금액 조회
  - OWNER: 계약 삭제

## 파일 구조

```
contracts/
├── entities/
│   ├── contract.entity.ts           # 계약 엔티티
│   └── contract-history.entity.ts   # 변경 이력 엔티티
├── services/
│   └── encryption.service.ts        # AES-256-GCM 암호화 서비스
├── dto/
│   ├── create-contract.dto.ts       # 생성 DTO
│   ├── update-contract.dto.ts       # 수정 DTO (PartialType)
│   ├── query-contract.dto.ts        # 조회 필터 DTO
│   └── update-status.dto.ts         # 상태 변경 DTO
├── contracts.service.ts             # 비즈니스 로직
├── contracts.controller.ts          # REST API 엔드포인트
└── contracts.module.ts              # NestJS 모듈
```

## API 엔드포인트

### 기본 CRUD

```
POST   /api/v1/contracts              # 계약 생성 (EDITOR+)
GET    /api/v1/contracts              # 계약 목록 (EDITOR+)
GET    /api/v1/contracts/:id          # 계약 상세 (EDITOR+, 금액은 ADMIN+)
PATCH  /api/v1/contracts/:id          # 계약 수정 (EDITOR+)
DELETE /api/v1/contracts/:id          # 계약 삭제 (OWNER)
```

### 상태 관리

```
PATCH  /api/v1/contracts/:id/status   # 상태 변경 (EDITOR+)
POST   /api/v1/contracts/:id/renew    # 계약 갱신 (EDITOR+)
```

### 대시보드 & 통계

```
GET    /api/v1/contracts/dashboard    # 계약 통계 (EDITOR+)
GET    /api/v1/contracts/expiring     # 만료 예정 계약 (EDITOR+)
       ?days=30
```

### 이력

```
GET    /api/v1/contracts/:id/history  # 변경 이력 (EDITOR+)
```

## 데이터 모델

### Contract

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| tenantId | UUID | 테넌트 ID (멀티테넌시) |
| title | VARCHAR(255) | 계약 제목 |
| contractNumber | VARCHAR(100) | 계약 번호 (선택) |
| contractType | ENUM | service/license/maintenance/nda/mou/other |
| partyA | VARCHAR(255) | 계약 당사자 A (우리 측) |
| partyB | VARCHAR(255) | 계약 당사자 B (상대방) |
| partyBContact | JSONB | 상대방 연락처 (name, email, phone) |
| startDate | DATE | 계약 시작일 |
| endDate | DATE | 계약 종료일 (NULL: 무기한) |
| amountEncrypted | TEXT | 암호화된 계약 금액 (AES-256-GCM) |
| currency | VARCHAR(10) | 통화 (KRW, USD 등) |
| paymentTerms | TEXT | 결제 조건 |
| status | ENUM | draft/active/expired/terminated/renewed |
| autoRenewal | BOOLEAN | 자동 갱신 여부 |
| renewalNoticeDays | INT | 갱신 통보 기한 (일) |
| description | TEXT | 계약 내용 요약 |
| attachments | JSONB | 첨부파일 목록 |
| parentContractId | UUID | 원계약 ID (갱신 시) |
| createdBy | UUID | 생성자 FK |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

### ContractHistory

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| contractId | UUID | 계약 FK |
| action | ENUM | created/updated/renewed/terminated |
| previousData | JSONB | 변경 전 데이터 |
| newData | JSONB | 변경 후 데이터 |
| changedBy | UUID | 변경자 FK |
| changedAt | TIMESTAMP | 변경일시 |

## 암호화 사용법

### 1. 암호화 키 생성

```bash
# 방법 1: 스크립트 사용
node scripts/generate-encryption-key.js

# 방법 2: Node.js 직접 실행
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 환경변수 설정

```bash
# .env
CONTRACT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

**주의사항**:
- 키는 **64자 hex 문자열** (32바이트) 이어야 함
- 키 분실 시 **암호화된 금액 복구 불가**
- 프로덕션: AWS Secrets Manager, HashiCorp Vault 등 사용 권장

### 3. 암호화 동작

**생성 시**:
```typescript
// DTO에서는 평문으로 받음
{
  "amount": 50000000  // number
}

// 서비스에서 자동 암호화
contract.amountEncrypted = encryptionService.encrypt("50000000");
// 결과: "iv:authTag:ciphertext" 형식 (hex)
```

**조회 시**:
```typescript
// 서비스에서 자동 복호화
const decrypted = encryptionService.decrypt(contract.amountEncrypted);
contract.amount = parseFloat(decrypted);

// EDITOR는 금액 필드 제외
if (user.role === 'editor') {
  delete contract.amount;
  delete contract.amountEncrypted;
}
```

## 권한 설정

| 작업 | OWNER | ADMIN | EDITOR | ANALYST | VIEWER |
|------|:-----:|:-----:|:------:|:-------:|:------:|
| 계약 목록 조회 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 계약 상세 조회 | ✅ | ✅ | ✅ (금액 제외) | ❌ | ❌ |
| 계약 금액 조회 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 계약 생성 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 계약 수정 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 계약 삭제 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 상태 변경 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 계약 갱신 | ✅ | ✅ | ✅ | ❌ | ❌ |

## 사용 예시

### 1. 계약 생성

```bash
POST /api/v1/contracts
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "보안 서비스 계약",
  "contractNumber": "CT-2026-001",
  "contractType": "service",
  "partyA": "(주)오타이산",
  "partyB": "ABC Corporation",
  "partyBContact": {
    "name": "홍길동",
    "email": "hong@abc.com",
    "phone": "010-1234-5678"
  },
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "amount": 50000000,
  "currency": "KRW",
  "paymentTerms": "월 말일 지급",
  "status": "draft",
  "autoRenewal": false,
  "renewalNoticeDays": 30,
  "description": "연간 보안 관제 서비스 제공 계약"
}
```

### 2. 만료 예정 계약 조회

```bash
GET /api/v1/contracts/expiring?days=30
Authorization: Bearer <JWT_TOKEN>

# 응답: 30일 이내 만료 예정 계약 목록
```

### 3. 계약 갱신

```bash
POST /api/v1/contracts/:id/renew
Authorization: Bearer <JWT_TOKEN>

# 결과:
# 1. 기존 계약 status → "renewed"
# 2. 새 계약 생성 (parentContractId = 기존 id)
# 3. 히스토리 기록
```

### 4. 대시보드 조회

```bash
GET /api/v1/contracts/dashboard
Authorization: Bearer <JWT_TOKEN>

# 응답 예시:
{
  "total": 45,
  "byStatus": [
    { "status": "active", "count": 30 },
    { "status": "draft", "count": 5 },
    { "status": "expired", "count": 10 }
  ],
  "byType": [
    { "type": "service", "count": 20 },
    { "type": "license", "count": 15 },
    { "type": "maintenance", "count": 10 }
  ],
  "expiring": {
    "within30Days": 5,
    "within7Days": 2
  }
}
```

## 인덱스

성능 최적화를 위해 다음 인덱스가 설정되어 있습니다:

```sql
-- 복합 인덱스 (멀티테넌시 + 필터)
CREATE INDEX idx_contracts_tenant_status ON contracts(tenant_id, status);
CREATE INDEX idx_contracts_tenant_end_date ON contracts(tenant_id, end_date);
CREATE INDEX idx_contracts_tenant_type ON contracts(tenant_id, contract_type);
```

## 변경 이력

모든 주요 작업은 `contract_history` 테이블에 자동 기록됩니다:

- **created**: 계약 생성 시
- **updated**: 계약 수정 시
- **renewed**: 계약 갱신 시
- **terminated**: 계약 해지 시

히스토리에는 변경 전/후 데이터와 변경자, 변경 시간이 저장됩니다.

## 보안 고려사항

1. **암호화**
   - 계약 금액은 AES-256-GCM으로 암호화 저장
   - IV, AuthTag 포함 (AEAD - Authenticated Encryption with Associated Data)
   - 키 관리 철저히 (환경변수, 비밀 관리 시스템)

2. **접근 제어**
   - 모든 데이터는 `tenantId`로 격리 (멀티테넌시)
   - 역할 기반 접근 제어 (RBAC)
   - EDITOR는 금액 조회 불가 (민감 정보)

3. **감사 추적**
   - 모든 변경 이력 자동 기록
   - 변경자, 변경 시간, 변경 전/후 데이터 저장

4. **입력 검증**
   - class-validator로 DTO 검증
   - 날짜 형식, UUID, ENUM 등 타입 안전성 보장

## 추후 개선 사항

- [ ] 계약 만료 알림 Cron Job (30일/7일 전)
- [ ] 계약서 파일 업로드/다운로드
- [ ] 계약 금액 집계 (월별/연별)
- [ ] 계약 템플릿 기능
- [ ] 계약 승인 워크플로우
- [ ] 알림 이메일 발송 (만료 예정, 갱신 필요)
- [ ] 계약 검색 최적화 (Full-Text Search)

## 참고 문서

- [기획 문서](../../../../docs/design/planning.md)
- [CLAUDE.md](../../../../CLAUDE.md)
- [@msspbiz/shared 패키지](../../../../packages/shared/)
