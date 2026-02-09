# Backend 코드 검수 리포트

## 검수 정보
- **일시**: 2026-02-08
- **버전**: v0.1.0-alpha.8
- **검수자**: QA Agent (나검수)
- **검수 범위**: Users 모듈, Auth 모듈, Tasks 모듈, 보안 전반

---

## 요약

| 검수 영역 | 총 항목 | Pass | Fail | 심각도 |
|----------|--------|------|------|--------|
| 사용자 추가 API | 8 | 8 | 0 | - |
| DTO 유효성 검증 | 5 | 5 | 0 | - |
| 보안 검수 | 7 | 6 | 1 | Medium |
| TypeORM Entity | 4 | 4 | 0 | - |
| 모듈 의존성 | 3 | 3 | 0 | - |
| Tasks 서비스 | 3 | 3 | 0 | - |
| **전체** | **30** | **29** | **1** | **96.7%** |

---

## 상세 결과

### 1. 사용자 추가 API ✅

**Controller (users.controller.ts)**
| 항목 | 상태 | 비고 |
|------|------|------|
| POST /users 엔드포인트 | ✅ | 정상 구현 |
| OWNER/ADMIN 권한 제한 | ✅ | @Roles(UserRole.OWNER, UserRole.ADMIN) |
| JWT Guard 적용 | ✅ | @UseGuards(JwtAuthGuard, RolesGuard) |
| tenantId 자동 주입 | ✅ | @CurrentUser('tenantId') |
| currentUser 역할 전달 | ✅ | @CurrentUser() currentUser |
| Swagger 문서화 | ✅ | @ApiOperation, @ApiResponse |
| HTTP 201 응답 코드 | ✅ | @HttpCode(HttpStatus.CREATED) |
| 409 Conflict 에러 정의 | ✅ | @ApiResponse({ status: 409 }) |

**Service (users.service.ts)**
| 항목 | 상태 | 비고 |
|------|------|------|
| 이메일 중복 체크 | ✅ | ConflictException |
| bcrypt 해싱 | ✅ | BCRYPT_SALT_ROUNDS = 12 |
| OWNER 역할 부여 차단 | ✅ | ForbiddenException |
| ADMIN 역할 권한 검증 | ✅ | currentUser.role === OWNER만 가능 |
| 비밀번호 응답 제거 | ✅ | const { passwordHash: _, ...result } |
| 기본 역할 설정 | ✅ | role: dto.role || UserRole.VIEWER |
| tenantId 격리 | ✅ | where: { email: dto.email, tenantId } |

---

### 2. DTO 유효성 검증 ✅

**CreateUserDto**
| 항목 | 상태 | 검증 규칙 |
|------|------|----------|
| email | ✅ | @IsEmail() |
| name | ✅ | @MinLength(2), @MaxLength(100) |
| password | ✅ | @MinLength(8) |
| role | ✅ | @IsOptional(), @IsEnum(UserRole) |
| Swagger 문서화 | ✅ | @ApiProperty, @ApiPropertyOptional |

**UpdateUserDto**
| 항목 | 상태 | 검증 규칙 |
|------|------|----------|
| name | ✅ | @IsOptional(), @MinLength(2), @MaxLength(100) |
| role | ✅ | @IsOptional(), @IsEnum(UserRole) |
| isActive | ✅ | @IsOptional(), @IsBoolean() |

**QueryUserDto**
| 항목 | 상태 | 검증 규칙 |
|------|------|----------|
| page | ✅ | @Type(() => Number), @Min(1), 기본값 1 |
| limit | ✅ | @Type(() => Number), @Min(1), 기본값 20 |
| search | ✅ | @IsOptional(), @IsString() |
| role | ✅ | @IsOptional(), @IsEnum(UserRole) |

---

### 3. 보안 검수 ⚠️

| 항목 | 상태 | 비고 |
|------|------|------|
| JWT Guard 적용 | ✅ | 모든 Users 엔드포인트에 적용 |
| RolesGuard 적용 | ✅ | 역할별 접근 제한 정상 |
| bcrypt salt rounds | ✅ | 12 (권장: 10-12) |
| 비밀번호 응답 제외 | ✅ | select 명시 또는 제거 처리 |
| tenantId 격리 | ✅ | 모든 쿼리에 where: { tenantId } |
| OWNER 역할 보호 | ✅ | 생성/수정 시 OWNER 부여 차단 |
| **JWT Payload 불일치** | ❌ | **Medium 심각도** - 상세 내용 아래 참조 |

---

### 4. TypeORM Entity ✅

**User Entity (user.entity.ts)**
| 컬럼 | 타입 | 제약 조건 | 상태 |
|------|------|----------|------|
| email | varchar(255) | unique(tenantId, email) | ✅ |
| passwordHash | varchar(255) | - | ✅ |
| name | varchar(100) | - | ✅ |
| role | enum | default: VIEWER | ✅ |
| isActive | boolean | default: true | ✅ |
| lastLoginAt | timestamp | nullable | ✅ |
| tenantId | uuid | FK to tenants | ✅ (TenantBaseEntity) |
| createdAt | timestamp | auto | ✅ (BaseEntity) |
| updatedAt | timestamp | auto | ✅ (BaseEntity) |

**인덱스**
- ✅ `@Index(['tenantId', 'email'], { unique: true })` - 복합 유니크 인덱스

---

### 5. 모듈 의존성 ✅

**UsersModule**
| 항목 | 상태 | 비고 |
|------|------|------|
| TypeORM 등록 | ✅ | TypeOrmModule.forFeature([User]) |
| Service 등록 | ✅ | providers: [UsersService] |
| Controller 등록 | ✅ | controllers: [UsersController] |
| Service export | ✅ | exports: [UsersService] |

**빌드 검증**
- ✅ shared 패키지 빌드 성공
- ✅ backend 패키지 빌드 성공
- ✅ 모든 DTO import 정상

---

### 6. Tasks 서비스 ✅

**perPage → limit 변경**
| 항목 | 상태 | 비고 |
|------|------|------|
| limit 파라미터 | ✅ | const { limit = 20 } = query |
| skip 계산 | ✅ | (page - 1) * limit |
| take 적용 | ✅ | queryBuilder.take(limit) |
| meta 응답 형식 | ✅ | meta: { page, limit, total, totalPages } |

**응답 형식**
```typescript
{
  success: true,
  data: Task[],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

---

## 발견된 이슈

### ISSUE-001: JWT Payload 필드명 불일치 ⚠️

**심각도**: Medium
**영역**: 보안 / 인증
**영향 범위**: @CurrentUser 데코레이터 사용 시 혼란 가능

**상세 내용**:

**1. JwtPayload 타입 정의 (shared/src/types/index.ts)**
```typescript
export interface JwtPayload {
  sub: string;        // userId  ← 주석으로 "userId"라고 명시
  tenantId: string;
  email: string;
  role: string;
}
```

**2. JWT 전략 validate 메서드 (jwt.strategy.ts)**
```typescript
async validate(payload: JwtPayload): Promise<{
  id: string;       // ← payload.sub를 id로 변환
  tenantId: string;
  email: string;
  role: string;
}> {
  return {
    id: payload.sub,  // sub → id 변환
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role,
  };
}
```

**3. Controller에서 사용**
```typescript
// users.controller.ts (올바름)
@CurrentUser('tenantId') tenantId: string,
@CurrentUser() currentUser: any,

// controller에서 currentUser.role, currentUser.id 사용
```

**문제점**:
- JwtPayload 타입 주석에 `sub: string; // userId`라고 명시되어 있어 혼란 발생 가능
- 실제로는 `sub`가 JWT 표준 클레임이며, `id`로 변환되어 사용됨
- 개발자가 `@CurrentUser('userId')`로 잘못 사용할 가능성 존재

**현재 상태**:
- ✅ 실제 코드는 정상 동작 (id로 일관되게 사용)
- ❌ 주석이 혼란을 야기할 수 있음

**권고 사항**:
1. JwtPayload 타입 주석 수정
```typescript
export interface JwtPayload {
  sub: string;        // user ID (JWT standard claim)
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
```

2. 문서화 추가
```typescript
/**
 * JWT Payload 인터페이스
 *
 * @property sub - User ID (JWT 표준 클레임, request.user.id로 변환됨)
 * @property tenantId - Tenant ID
 * @property email - 사용자 이메일
 * @property role - 사용자 역할
 */
export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
```

3. @CurrentUser 사용 예시 문서 추가
```typescript
// ✅ 올바른 사용법
@CurrentUser('id') userId: string          // JWT payload.sub → request.user.id
@CurrentUser('tenantId') tenantId: string  // JWT payload.tenantId
@CurrentUser('role') role: string          // JWT payload.role
@CurrentUser() currentUser: any            // 전체 user 객체

// ❌ 잘못된 사용법
@CurrentUser('userId') userId: string      // 존재하지 않는 필드!
@CurrentUser('sub') sub: string           // JWT에서는 sub이지만 변환 후엔 id
```

**우선순위**: P3 (문서화 개선)
- 기능은 정상 동작하므로 즉시 수정 불필요
- 다음 문서화 작업 시 포함 권장
- 신규 개발자 온보딩 자료에 명시

---

## 추가 권고사항

### 우선순위 높음
1. 없음 (모든 핵심 기능 정상)

### 우선순위 중간
1. **JWT Payload 문서화 개선** (ISSUE-001)
   - JwtPayload 타입 주석 수정
   - @CurrentUser 데코레이터 사용 가이드 추가

2. **Users 목록 검색 기능 확장**
   - 현재: name만 검색 (Like)
   - 권장: name + email OR 조건으로 확장
   ```typescript
   if (search) {
     where = [
       { tenantId, name: Like(`%${search}%`) },
       { tenantId, email: Like(`%${search}%`) },
     ];
   }
   ```

### 우선순위 낮음
1. **에러 메시지 다국어 지원 준비**
   - 현재: 한글 하드코딩
   - 향후: i18n 라이브러리 도입 고려

2. **비밀번호 복잡도 검증 강화**
   - 현재: 최소 8자
   - 권장: 대소문자, 숫자, 특수문자 조합 (선택적)

---

## 테스트 권고사항

### 단위 테스트 (Jest)
```typescript
describe('UsersService', () => {
  it('이메일 중복 시 ConflictException 발생', async () => {
    // 구현 필요
  });

  it('OWNER 역할 부여 시 ForbiddenException 발생', async () => {
    // 구현 필요
  });

  it('ADMIN이 아닌 사용자가 ADMIN 생성 시 ForbiddenException 발생', async () => {
    // 구현 필요
  });

  it('비밀번호가 bcrypt로 해싱되는지 확인', async () => {
    // 구현 필요
  });
});
```

### E2E 테스트 (Playwright)
```typescript
test('사용자 추가 플로우', async ({ page }) => {
  // 1. OWNER 로그인
  // 2. 사용자 관리 페이지 이동
  // 3. 팀원 추가 모달 열기
  // 4. 정보 입력 및 제출
  // 5. 목록에 새 사용자 표시 확인
});
```

---

## 보안 체크리스트 ✅

| 항목 | 상태 | 비고 |
|------|------|------|
| SQL Injection 방어 | ✅ | TypeORM 파라미터 바인딩 |
| XSS 방어 | ✅ | 입력 검증 (class-validator) |
| CSRF 방어 | ⚠️ | SPA이므로 낮은 우선순위 |
| 인증 토큰 보안 | ✅ | JWT Bearer Token |
| 비밀번호 해싱 | ✅ | bcrypt, salt rounds 12 |
| 역할 기반 접근 제어 | ✅ | RolesGuard |
| 멀티테넌시 격리 | ✅ | 모든 쿼리에 tenantId |
| 민감 정보 노출 방지 | ✅ | passwordHash 제거 |
| Rate Limiting | ⚠️ | 향후 추가 권장 |
| Input Validation | ✅ | class-validator |

---

## 빌드 검증

```bash
✅ pnpm run build --filter=@msspbiz/shared
   Tasks: 1 successful, 1 total
   Cached: 1 cached, 1 total

✅ pnpm run build --filter=@msspbiz/backend
   Tasks: 2 successful, 2 total
```

---

## 결론

**전체 평가**: 🟢 양호 (Pass Rate: 96.7%)

**강점**:
- ✅ 보안 설계 우수 (bcrypt, JWT, RBAC, 멀티테넌시)
- ✅ 코드 품질 일관성 유지
- ✅ 유효성 검증 철저
- ✅ 에러 처리 명확
- ✅ TypeORM 엔티티 설계 적절

**개선 영역**:
- ⚠️ JWT Payload 문서화 개선 필요 (Medium)
- 📝 테스트 코드 작성 필요

**최종 권고**:
- 현재 코드는 프로덕션 배포 가능 수준
- JWT 문서화는 다음 버전에서 개선 권장
- E2E 테스트 작성 후 배포 권장

---

**검수 완료일**: 2026-02-08
**검수자**: 나검수 (QA Agent)
**다음 검수 예정**: v0.1.0-beta.1 (전체 기능 완성 후)
