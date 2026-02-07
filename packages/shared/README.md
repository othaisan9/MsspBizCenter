# @msspbiz/shared

MsspBizCenter 프로젝트의 공유 타입, Enum, 상수 패키지입니다.

## 구조

```
src/
├── index.ts           # 모든 exports re-export
├── enums/
│   └── index.ts      # TaskStatus, TaskPriority, MeetingType 등
├── types/
│   └── index.ts      # ApiResponse, PaginationParams, JwtPayload 등
└── constants/
    └── index.ts      # APP_NAME, API_PREFIX, 기본값 등
```

## 사용법

### Backend (Python)
Python에서는 별도의 enum/type 파일을 참고하여 동일한 값을 유지합니다.

```python
# app/models/enums.py
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    REVIEW = 'review'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
```

### Frontend (TypeScript)
```typescript
import { TaskStatus, TaskPriority, ApiResponse } from '@msspbiz/shared';

const status: TaskStatus = TaskStatus.IN_PROGRESS;
```

## 빌드

```bash
npm run build       # TypeScript 컴파일
npm run dev         # Watch 모드
npm run clean       # dist/ 폴더 삭제
```

## 버전

현재 버전: 0.1.0-alpha.3

버전은 루트 VERSION 파일과 동기화됩니다.
