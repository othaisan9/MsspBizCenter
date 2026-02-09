# AI 모듈

MsspBizCenter의 AI 기능을 제공하는 모듈입니다. Anthropic Claude, OpenAI, Ollama를 지원합니다.

## 주요 기능

### 1. AI 설정 관리
- **AI 제공자 선택**: Anthropic, OpenAI, Ollama
- **API 키 관리**: AES-256-GCM 암호화 저장
- **모델 설정**: 기본 모델, 빠른 모델 설정
- **예산 제한**: 월간 예산 한도 설정

### 2. AI 생성 기능

#### 업무 관련
- **업무 설명 생성**: 제목과 태그를 기반으로 상세 설명 자동 생성
- **내 성과 분석**: 사용자의 업무 데이터를 분석하여 성과 리포트 생성 (스트리밍)

#### 회의록 관련
- **회의록 요약**: 회의록 내용을 핵심 요약
- **Action Item 추출**: 회의록에서 실행 항목을 자동 추출 (JSON)
- **회의 템플릿 생성**: 회의 유형에 맞는 템플릿 생성

#### 분석 및 보고
- **주간 보고서**: 팀의 주간 업무를 분석하여 보고서 생성 (스트리밍, ANALYST 이상)
- **AI 채팅**: 업무 데이터를 컨텍스트로 사용하는 대화형 AI (스트리밍)

## API 엔드포인트

### AI 설정
```
GET    /api/v1/ai/settings          # AI 설정 조회 (OWNER, ADMIN)
PATCH  /api/v1/ai/settings          # AI 설정 수정 (OWNER, ADMIN)
```

### AI 생성
```
POST   /api/v1/ai/generate-task-desc          # 업무 설명 생성
POST   /api/v1/ai/generate-meeting-template   # 회의 템플릿 생성
POST   /api/v1/ai/summarize-meeting           # 회의록 요약
POST   /api/v1/ai/my-performance              # 내 성과 분석 (SSE)
POST   /api/v1/ai/weekly-report               # 주간 보고서 (SSE, ANALYST+)
POST   /api/v1/ai/extract-actions             # Action Item 추출
POST   /api/v1/ai/chat                        # AI 채팅 (SSE)
```

## 사용 예시

### 1. AI 설정

```typescript
// AI 설정 조회
GET /api/v1/ai/settings
Authorization: Bearer {token}

// AI 설정 업데이트
PATCH /api/v1/ai/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "anthropic",
  "apiKey": "sk-ant-api03-...",
  "defaultModel": "claude-sonnet-4-5-20250929",
  "fastModel": "claude-haiku-4-5-20251001",
  "isEnabled": true,
  "monthlyBudgetLimit": 100.00
}
```

### 2. 업무 설명 생성

```typescript
POST /api/v1/ai/generate-task-desc
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "API 서버 성능 개선",
  "tags": ["backend", "performance"],
  "priority": "high"
}

// 응답
{
  "description": "업무의 목적과 배경:\n이 업무는 현재 API 서버의 응답 시간을 개선하여..."
}
```

### 3. 회의록 요약

```typescript
POST /api/v1/ai/summarize-meeting
Authorization: Bearer {token}
Content-Type: application/json

{
  "meetingId": "123e4567-e89b-12d3-a456-426614174000"
}

// 응답
{
  "summary": "1. 회의 주제 및 목적\n이번 회의는 Q1 스프린트 계획 수립을 위해..."
}
```

### 4. 내 성과 분석 (스트리밍)

```typescript
POST /api/v1/ai/my-performance
Authorization: Bearer {token}
Content-Type: application/json

// SSE 스트리밍 응답
data: {"text":"전반적인"}
data: {"text":" 업무"}
data: {"text":" 진행"}
...
data: [DONE]
```

### 5. Action Item 추출

```typescript
POST /api/v1/ai/extract-actions
Authorization: Bearer {token}
Content-Type: application/json

{
  "meetingId": "123e4567-e89b-12d3-a456-426614174000"
}

// 응답
{
  "actionItems": [
    {
      "title": "API 성능 테스트 수행",
      "assignee": "홍길동",
      "dueDate": "2026-02-15",
      "priority": "high"
    },
    {
      "title": "데이터베이스 인덱스 최적화",
      "assignee": "김철수",
      "dueDate": null,
      "priority": "medium"
    }
  ]
}
```

### 6. 주간 보고서 (스트리밍)

```typescript
POST /api/v1/ai/weekly-report
Authorization: Bearer {token}
Content-Type: application/json

{
  "year": 2026,
  "weekNumber": 6
}

// SSE 스트리밍 응답
data: {"text":"# 주간"}
data: {"text":" 보고서"}
...
data: [DONE]
```

## 아키텍처

```
ai/
├── entities/
│   └── ai-settings.entity.ts       # AI 설정 엔티티
├── providers/
│   ├── llm-provider.interface.ts   # LLM Provider 인터페이스
│   ├── anthropic.provider.ts       # Anthropic Claude 구현
│   ├── openai.provider.ts          # OpenAI GPT 구현
│   └── ollama.provider.ts          # Ollama 로컬 LLM 구현
├── services/
│   ├── ai-settings.service.ts      # AI 설정 관리
│   └── prompt-builder.service.ts   # 프롬프트 생성
├── dto/
│   ├── ai-settings.dto.ts          # AI 설정 DTO
│   └── generate.dto.ts             # AI 생성 요청 DTO
├── ai.service.ts                   # AI 오케스트레이터
├── ai.controller.ts                # AI 기능 컨트롤러
├── ai-settings.controller.ts       # AI 설정 컨트롤러
└── ai.module.ts                    # AI 모듈
```

## 보안

### API 키 암호화
- **알고리즘**: AES-256-GCM
- **키 관리**: CONTRACT_ENCRYPTION_KEY 환경변수 (64자 hex)
- **저장**: 암호화된 상태로 DB에 저장
- **조회**: API 키는 마스킹하여 반환 (sk-...****)
- **로깅**: API 키는 절대 로그에 출력되지 않음

### 계약 금액 보호
- 계약 금액(encrypted 필드)은 절대 LLM에 전송되지 않음
- 민감 정보는 프롬프트에서 제외

### 권한 관리
- **AI 설정**: OWNER, ADMIN만 수정 가능
- **AI 생성 기능**: 인증된 모든 사용자
- **주간 보고서**: ANALYST 이상만 접근 가능

## 환경 변수

```bash
# 계약 금액 암호화 키 (AI API 키도 이 키로 암호화)
CONTRACT_ENCRYPTION_KEY=your_64_char_hex_key_here

# 생성 방법:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 의존성

```json
{
  "@anthropic-ai/sdk": "^0.x.x",
  "openai": "^4.x.x",
  "ollama": "^0.x.x"
}
```

## 마이그레이션

```bash
# AI 설정 테이블 생성
pnpm run typeorm migration:run

# 마이그레이션 파일: src/migrations/1739027000000-CreateAiSettingsTable.ts
```

## 프롬프트 커스터마이징

프롬프트는 `services/prompt-builder.service.ts`에서 관리합니다.
각 기능별 시스템 프롬프트를 수정하여 AI 응답을 조정할 수 있습니다.

```typescript
// 예: 업무 설명 생성 프롬프트 수정
buildTaskDescPrompt(title: string, tags?: string[], priority?: string) {
  return {
    system: `당신은 업무 관리 전문가입니다. ...`,
    user: `업무 제목: ${title}...`,
  };
}
```

## 제한 사항

- **스트리밍**: SSE 방식이므로 클라이언트에서 EventSource 또는 fetch로 처리 필요
- **토큰 제한**: 각 기능별 maxTokens 설정 (2000~4000)
- **예산 관리**: 현재는 설정만 저장, 실제 사용량 추적은 미구현
- **Ollama**: 로컬 실행 시 네트워크 설정 필요

## 향후 계획

- [ ] 토큰 사용량 추적 및 로깅
- [ ] 월간 예산 초과 시 자동 비활성화
- [ ] 다국어 지원 (현재는 한국어만)
- [ ] 프롬프트 템플릿 DB 관리
- [ ] AI 응답 캐싱
- [ ] 사용자별 AI 사용량 대시보드
