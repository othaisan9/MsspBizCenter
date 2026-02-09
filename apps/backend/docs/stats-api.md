# Stats API Documentation

## 개요
대시보드 및 통계 데이터를 제공하는 API입니다. 모든 엔드포인트는 JWT 인증이 필요하며, 테넌트별로 데이터가 격리됩니다.

## 인증
모든 요청에 JWT 토큰을 포함해야 합니다.
```
Authorization: Bearer <your-jwt-token>
```

## 엔드포인트

### 1. 대시보드 전체 통계
**GET** `/api/v1/stats/dashboard`

**설명**: 대시보드에 표시할 주요 통계를 반환합니다.

**Response**:
```json
{
  "totalTasks": 150,
  "completedThisWeek": 12,
  "inProgressTasks": 25,
  "totalMeetings": 45,
  "totalContracts": 18,
  "activeContracts": 15,
  "expiringContracts": 3
}
```

**필드 설명**:
- `totalTasks`: 전체 업무 수
- `completedThisWeek`: 이번주 완료한 업무 수
- `inProgressTasks`: 현재 진행 중인 업무 수
- `totalMeetings`: 전체 회의 수
- `totalContracts`: 전체 계약 수
- `activeContracts`: 활성 계약 수
- `expiringContracts`: 만료 임박 계약 수 (30일 이내)

---

### 2. 주차별 업무 통계
**GET** `/api/v1/stats/tasks/weekly`

**설명**: 최근 12주간의 업무 통계를 반환합니다.

**Response**:
```json
[
  {
    "year": 2026,
    "week": 6,
    "total": 28,
    "completed": 18,
    "inProgress": 7
  },
  {
    "year": 2026,
    "week": 5,
    "total": 32,
    "completed": 25,
    "inProgress": 5
  }
]
```

**필드 설명**:
- `year`: 연도
- `week`: 주차 (1-53)
- `total`: 해당 주의 전체 업무 수
- `completed`: 완료된 업무 수
- `inProgress`: 진행 중인 업무 수

---

### 3. 월별 계약 통계
**GET** `/api/v1/stats/contracts/monthly`

**설명**: 최근 12개월간의 계약 통계를 반환합니다.

**Response**:
```json
[
  {
    "year": 2026,
    "month": 2,
    "newContracts": 5,
    "renewals": 2,
    "totalAmount": 0
  },
  {
    "year": 2026,
    "month": 1,
    "newContracts": 3,
    "renewals": 1,
    "totalAmount": 0
  }
]
```

**필드 설명**:
- `year`: 연도
- `month`: 월 (1-12)
- `newContracts`: 신규 계약 수
- `renewals`: 갱신 계약 수
- `totalAmount`: 총 계약 금액 (현재 암호화로 인해 0)

**주의**: 계약 금액은 AES-256-GCM으로 암호화되어 저장되므로, DB 수준에서 합계를 계산할 수 없습니다. 향후 복호화 로직을 추가하여 계산할 예정입니다.

---

### 4. 상태별 업무 비율
**GET** `/api/v1/stats/tasks/by-status`

**설명**: 모든 업무를 상태별로 집계하고 비율을 계산합니다.

**Response**:
```json
[
  {
    "status": "completed",
    "count": 85,
    "percentage": 56.67
  },
  {
    "status": "in_progress",
    "count": 40,
    "percentage": 26.67
  },
  {
    "status": "pending",
    "count": 20,
    "percentage": 13.33
  },
  {
    "status": "review",
    "count": 5,
    "percentage": 3.33
  }
]
```

**필드 설명**:
- `status`: 업무 상태 (pending, in_progress, review, completed, cancelled)
- `count`: 해당 상태의 업무 수
- `percentage`: 전체 대비 비율 (%)

---

### 5. 우선순위별 업무 비율
**GET** `/api/v1/stats/tasks/by-priority`

**설명**: 모든 업무를 우선순위별로 집계하고 비율을 계산합니다.

**Response**:
```json
[
  {
    "priority": "medium",
    "count": 70,
    "percentage": 46.67
  },
  {
    "priority": "high",
    "count": 50,
    "percentage": 33.33
  },
  {
    "priority": "low",
    "count": 25,
    "percentage": 16.67
  },
  {
    "priority": "critical",
    "count": 5,
    "percentage": 3.33
  }
]
```

**필드 설명**:
- `priority`: 우선순위 (critical, high, medium, low)
- `count`: 해당 우선순위의 업무 수
- `percentage`: 전체 대비 비율 (%)

---

## 에러 응답

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Authentication failed"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## 사용 예시

### cURL
```bash
# 대시보드 통계 조회
curl -X GET http://localhost:4001/api/v1/stats/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 주차별 업무 통계 조회
curl -X GET http://localhost:4001/api/v1/stats/tasks/weekly \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript (Fetch)
```javascript
const token = 'YOUR_JWT_TOKEN';

// 대시보드 통계 조회
const response = await fetch('http://localhost:4001/api/v1/stats/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const stats = await response.json();
console.log(stats);
```

---

## Swagger UI
개발 환경에서는 Swagger UI를 통해 API를 테스트할 수 있습니다.

URL: http://localhost:4001/api/docs

1. Swagger UI에 접속
2. "Authorize" 버튼 클릭
3. JWT 토큰 입력
4. Stats 엔드포인트 테스트

---

## 주의사항

1. **테넌트 격리**: 모든 쿼리는 JWT의 `tenantId`로 자동 필터링됩니다.
2. **성능**: 대량의 데이터가 있는 경우, 집계 쿼리가 느릴 수 있습니다. 필요시 캐싱을 고려하세요.
3. **암호화된 금액**: 계약 금액은 암호화되어 저장되므로 합계 계산이 제한적입니다.
4. **주차 계산**: ISO 8601 주차 표준을 사용하지 않고, 연초부터의 일수를 7로 나눈 값을 사용합니다.

---

## 구현 파일

- **Controller**: `/src/modules/stats/stats.controller.ts`
- **Service**: `/src/modules/stats/stats.service.ts`
- **Module**: `/src/modules/stats/stats.module.ts`
- **DTO**: `/src/modules/stats/dto/stats-response.dto.ts`
