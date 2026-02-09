# NestJS Backend 구현 현황 (v0.1.0-alpha.10)

**작성일**: 2026-02-09
**담당자**: 박안도 (Backend)
**상태**: 11개 모듈 구현 완료, Docker 핫리로드 운영 중

> **참고**: v0.1.0-alpha.3에서 Flask → NestJS로 기술 스택 전환됨

## 1. 프로젝트 구조

```
apps/backend/src/
├── main.ts                        # 앱 부트스트랩 (글로벌 프리픽스, Swagger, helmet, CORS)
├── app.module.ts                  # 루트 모듈 (ThrottlerModule, 전체 모듈 등록)
├── common/
│   ├── entities/base.entity.ts    # TenantBaseEntity (id, tenantId, createdAt, updatedAt)
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() JWT 페이로드 추출
│   │   └── roles.decorator.ts         # @Roles() 역할 지정
│   ├── guards/
│   │   └── roles.guard.ts             # RolesGuard (RBAC 검증)
│   ├── filters/
│   │   └── http-exception.filter.ts   # 전역 예외 필터
│   └── services/
│       └── encryption.service.ts      # AES-256-GCM 암호화/복호화
└── modules/
    ├── auth/          # 인증 (JWT HS256, Passport, Login/Register/Refresh/Me)
    ├── users/         # 사용자 CRUD + RBAC
    ├── tasks/         # 업무 CRUD + 주차별 조회 + 상태 변경 + 할당
    ├── meetings/      # 회의록 CRUD + 참석자 + 액션아이템
    ├── contracts/     # 계약 CRUD + 금액 암호화 + 재무 계산 + 히스토리
    ├── products/      # 제품/옵션 마스터 데이터 + 계약-제품 연결
    ├── files/         # 파일 업로드/다운로드 (Multer, 10MB, MIME 화이트리스트)
    ├── stats/         # 대시보드 통계 API (5개 엔드포인트)
    ├── audit/         # 감사 로그 (90일 보존)
    ├── ai/            # AI 어시스턴트 (4 LLM 프로바이더, SSE 스트리밍)
    └── common/        # 공유 엔티티, 가드, 데코레이터, 필터, 서비스
```

## 2. 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.7+ |
| ORM | TypeORM | 0.3.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7.x |
| Auth | @nestjs/passport + passport-jwt | - |
| Validation | class-validator + class-transformer | 0.14+ |
| Security | helmet + @nestjs/throttler | - |
| File Upload | Multer (@nestjs/platform-express) | - |
| AI SDK | @anthropic-ai/sdk, openai, @google/genai | - |
| Encryption | crypto (Node.js built-in AES-256-GCM) | - |
| API Docs | @nestjs/swagger | - |
| Testing | Jest | 29.x |

## 3. 구현된 모듈 (11개)

### 3.1 Auth 모듈

**경로**: `modules/auth/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/auth/login` | POST | 로그인 (JWT 발급) | Public |
| `/api/v1/auth/register` | POST | 회원가입 | Public |
| `/api/v1/auth/refresh` | POST | Access Token 갱신 | Public |
| `/api/v1/auth/me` | GET | 현재 사용자 정보 | All |

- JWT HS256 알고리즘
- Access Token (1h) + Refresh Token (7d)
- 로그인 Rate Limit: 5req/60s (`@Throttle`)
- bcrypt 해싱 (salt rounds: 12)

### 3.2 Users 모듈

**경로**: `modules/users/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/users` | GET | 사용자 목록 | All |
| `/api/v1/users` | POST | 사용자 추가 | Admin+ |
| `/api/v1/users/:id` | PATCH | 사용자 수정 | Admin+ |
| `/api/v1/users/:id` | DELETE | 사용자 삭제 | Owner |

- OWNER 역할 부여 차단
- ADMIN 역할은 OWNER만 부여 가능
- 자기 역할 변경 방지

### 3.3 Tasks 모듈

**경로**: `modules/tasks/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/tasks` | GET | 목록 (페이징/필터/검색) | All |
| `/api/v1/tasks` | POST | 생성 | Editor+ |
| `/api/v1/tasks/weekly` | GET | 주차별 조회 | All |
| `/api/v1/tasks/:id` | GET | 상세 | All |
| `/api/v1/tasks/:id` | PATCH | 수정 | Editor+ |
| `/api/v1/tasks/:id` | DELETE | 삭제 | Admin+ |
| `/api/v1/tasks/:id/status` | PATCH | 상태 변경 | Editor+ |
| `/api/v1/tasks/:id/assign` | PATCH | 담당자 할당 | Editor+ |

- 필터: status, priority, assigneeId, weekNumber, year, search
- 페이지네이션: page, limit, sortBy, sortOrder
- sortBy SQL Injection 방어 (화이트리스트 검증)
- 태그: TEXT[] (PostgreSQL 배열)

### 3.4 Meetings 모듈

**경로**: `modules/meetings/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/meetings` | GET | 목록 | All |
| `/api/v1/meetings` | POST | 생성 | Editor+ |
| `/api/v1/meetings/:id` | GET | 상세 | All |
| `/api/v1/meetings/:id` | PATCH | 수정 | Editor+ |
| `/api/v1/meetings/:id` | DELETE | 삭제 | Admin+ |

- 참석자 (MeetingAttendee): attended/absent/optional
- 안건, 결정사항 (JSONB)
- 액션 아이템 (ActionItem): 담당자, 마감일, 상태

### 3.5 Contracts 모듈

**경로**: `modules/contracts/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/contracts` | GET | 목록 | Editor+ |
| `/api/v1/contracts` | POST | 생성 | Admin+ |
| `/api/v1/contracts/dashboard` | GET | 대시보드 통계 | Editor+ |
| `/api/v1/contracts/:id` | GET | 상세 (금액 복호화) | Editor+ |
| `/api/v1/contracts/:id` | PATCH | 수정 | Admin+ |
| `/api/v1/contracts/:id` | DELETE | 삭제 | Owner |
| `/api/v1/contracts/:id/history` | GET | 변경 이력 | Editor+ |

- 금액 암호화: amount, purchasePrice, sellingPrice (AES-256-GCM)
- 재무 필드: paymentCycle, VAT, 마진 계산
- ContractProduct OneToMany (계약-제품 연결)
- ContractHistory 변경 이력 자동 기록

### 3.6 Products 모듈

**경로**: `modules/products/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/products` | GET | 제품 목록 (옵션 포함) | All |
| `/api/v1/products` | POST | 제품 생성 | Admin+ |
| `/api/v1/products/:id` | GET | 제품 상세 | All |
| `/api/v1/products/:id` | PATCH | 제품 수정 | Admin+ |
| `/api/v1/products/:id` | DELETE | 제품 삭제 (INACTIVE) | Owner |
| `/api/v1/products/:id/options` | POST | 옵션 추가 | Admin+ |
| `/api/v1/products/:id/options/:optionId` | PATCH | 옵션 수정 | Admin+ |
| `/api/v1/products/:id/options/:optionId` | DELETE | 옵션 삭제 | Admin+ |

- Product: code (테넌트별 유니크), name, vendor, status
- ProductOption: code, name, type (사용자 정의 문자열), isActive
- 파생제품 유형 프리셋: 플랫폼, 서비스, 리포트, API, 컨설팅, 라이선스, 기타

### 3.7 Files 모듈

**경로**: `modules/files/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/files/upload` | POST | 파일 업로드 | Editor+ |
| `/api/v1/files/:id` | GET | 파일 다운로드 | All |
| `/api/v1/files/:id` | DELETE | 파일 삭제 | Admin+ |

- Multer 기반 파일 업로드
- 최대 크기: 10MB
- MIME 화이트리스트: pdf, docx, xlsx, png, jpg, txt 등
- tenantId 기반 파일 경로 격리
- Path Traversal 방지 (regex 검증)

### 3.8 Stats 모듈

**경로**: `modules/stats/`

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/v1/stats/dashboard` | GET | 대시보드 전체 통계 | All |
| `/api/v1/stats/tasks/weekly` | GET | 주차별 업무 통계 (12주) | All |
| `/api/v1/stats/contracts/monthly` | GET | 월별 계약 통계 (12개월) | All |
| `/api/v1/stats/tasks/by-status` | GET | 상태별 업무 비율 | All |
| `/api/v1/stats/tasks/by-priority` | GET | 우선순위별 업무 비율 | All |

- N+1 쿼리 최적화 (queryBuilder 사용)
- 상세 문서: `apps/backend/docs/stats-api.md`

### 3.9 Audit 모듈

**경로**: `modules/audit/`

- 모든 민감 작업 자동 기록
- 엔티티 타입, 액션, 사용자, IP, 변경 내용
- 90일 보존 정책

### 3.10 AI 모듈

**경로**: `modules/ai/`

| 엔드포인트 | 메서드 | 설명 | 권한 | 응답 |
|-----------|--------|------|------|------|
| `/api/v1/ai/models` | POST | 모델 목록 조회 | Admin+ | JSON |
| `/api/v1/ai/generate-task-desc` | POST | 업무 설명 생성 | All | JSON |
| `/api/v1/ai/generate-meeting-template` | POST | 회의 템플릿 생성 | All | JSON |
| `/api/v1/ai/summarize-meeting` | POST | 회의 요약 | All | JSON |
| `/api/v1/ai/my-performance` | POST | 성과 분석 | All | SSE |
| `/api/v1/ai/weekly-report` | POST | 주간 리포트 | Analyst+ | SSE |
| `/api/v1/ai/extract-actions` | POST | 액션 아이템 추출 | All | JSON |
| `/api/v1/ai/chat` | POST | AI 채팅 | All | SSE |
| `/api/v1/ai/settings` | GET | 설정 조회 | Admin+ | JSON |
| `/api/v1/ai/settings` | PATCH | 설정 수정 | Admin+ | JSON |

**LLM 프로바이더**:

```typescript
interface LlmProvider {
  generate(prompt: string, options?: LlmOptions): Promise<string>;
  stream(prompt: string, options?: LlmOptions): AsyncGenerator<string>;
  listModels(apiKey?: string): Promise<LlmModel[]>;
}
```

| 프로바이더 | SDK | 모델 조회 방식 |
|-----------|-----|---------------|
| Anthropic | @anthropic-ai/sdk | `client.models.list()` |
| OpenAI | openai | `client.models.list()` (chat 모델 필터) |
| Gemini | @google/genai | `client.models.list()` (generateContent 지원만) |
| Ollama | ollama | `client.list()` (로컬 모델) |

- API 키 암호화 저장 (AES-256-GCM)
- PromptBuilder: 한국어 MSSP 컨텍스트 프롬프트
- SSE 스트리밍 (`text/event-stream`)
- 테넌트별 AI 설정 (프로바이더, 모델, 예산)

## 4. 공통 기능

### 멀티테넌시

- `TenantBaseEntity`: id (UUID), tenantId, createdAt, updatedAt
- JWT 토큰에 tenantId 포함
- 모든 쿼리에 tenantId 자동 필터링
- `@CurrentUser('tenantId')` 데코레이터

### 역할 기반 접근 제어 (RBAC)

```typescript
enum UserRole {
  OWNER = 'owner',     // 전체 권한
  ADMIN = 'admin',     // 대부분 권한
  EDITOR = 'editor',   // 생성/수정
  ANALYST = 'analyst', // 조회/생성
  VIEWER = 'viewer',   // 조회만
}
```

- `@Roles('admin', 'owner')` 데코레이터
- `RolesGuard` 가드
- 컨트롤러/메서드 레벨 적용

### 보안

- **helmet**: 보안 헤더 자동 적용
- **@nestjs/throttler**: 전역 Rate Limiting (60req/min)
- **CORS**: 프론트엔드 origin만 허용
- **Swagger**: 프로덕션 비활성화 (`NODE_ENV !== 'production'`)
- **SQL Injection 방어**: sortBy 화이트리스트 검증
- **Path Traversal 방어**: tenantId regex 검증

### 암호화

- **알고리즘**: AES-256-GCM (Node.js crypto)
- **대상**: 계약 금액 (amount, purchasePrice, sellingPrice), AI API 키
- **키**: 환경변수 `CONTRACT_ENCRYPTION_KEY` (32자)

## 5. 환경 설정

### Docker 개발 환경 (권장)

```bash
cd infra/docker
docker compose -f docker-compose.dev.yml up -d --build
```

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| PORT | 4001 | 서버 포트 |
| DB_HOST | postgres | PostgreSQL 호스트 |
| DB_PORT | 5432 | PostgreSQL 포트 |
| DB_USERNAME | msspbiz | DB 사용자 |
| DB_PASSWORD | password | DB 비밀번호 |
| DB_DATABASE | msspbiz | DB 이름 |
| DB_SYNCHRONIZE | true | TypeORM 자동 동기화 (개발만) |
| REDIS_HOST | redis | Redis 호스트 |
| REDIS_PORT | 6379 | Redis 포트 |
| JWT_SECRET | - | JWT 시크릿 키 |
| JWT_EXPIRES_IN | 1h | Access Token 만료 |
| JWT_REFRESH_SECRET | - | Refresh Token 시크릿 |
| JWT_REFRESH_EXPIRES_IN | 7d | Refresh Token 만료 |
| CONTRACT_ENCRYPTION_KEY | - | AES-256-GCM 키 (32자) |
| CORS_ORIGIN | http://localhost:3001 | 허용 Origin |
| THROTTLE_TTL | 60 | Rate Limit 윈도우 (초) |
| THROTTLE_LIMIT | 100 | Rate Limit 최대 요청 수 |

### 접속 정보

- **API**: http://localhost:4001/api/v1
- **Swagger**: http://localhost:4001/api/docs (개발 환경만)
- **Health**: http://localhost:4001/health

## 6. 빌드 및 테스트

```bash
# 빌드
pnpm --filter @msspbiz/backend build

# 개발 모드 (핫리로드)
pnpm --filter @msspbiz/backend start:dev

# 테스트
pnpm --filter @msspbiz/backend test
```

## 7. 향후 작업

### P0.5 (CRITICAL)
- [ ] JWT Secret 재생성 + .env Git 이력 제거
- [ ] Redis 캐싱 도입 (Dashboard Stats, Products)

### P1 (High)
- [ ] JWT HS256 → RS256 전환
- [ ] Refresh Token Redis 저장소
- [ ] CSRF 토큰 적용

### P2 (Medium)
- [ ] Unit Test 60% 커버리지
- [ ] 프로덕션 Docker 구성
- [ ] CI/CD 파이프라인
- [ ] 전문검색 (PostgreSQL tsvector)
- [ ] 리포트/PDF 생성

## 8. 관련 문서

- [Tasks API 문서](../../apps/backend/docs/API_TASKS.md)
- [Stats API 문서](../../apps/backend/docs/stats-api.md)
- [Products 모듈 문서](../../apps/backend/docs/PRODUCTS_MODULE.md)
- [Docker 개발 환경](../../infra/docker/README.md)
- [기획 문서](./planning.md)

---

**작성자**: 문서인 (Docs)
**검토자**: 박안도 (Backend)
**버전**: v0.1.0-alpha.10
**최종 수정일**: 2026-02-09
