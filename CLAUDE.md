# CLAUDE.md

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code에게 가이드를 제공합니다.

## MCP 도구 활용

- **Context7**: 외부 라이브러리/프레임워크 코드 작성 시 `resolve-library-id` → `get-library-docs`로 최신 문서를 확인한 후 구현할 것

## 스킬 활용 가이드

필요한 상황에서 아래 스킬을 자동으로 호출할 것:

| 스킬 | 호출 시점 |
|------|----------|
| `/버전업` | 커밋 전 버전 동기화가 필요할 때 |
| `/개발환경` | 포트, 환경변수, Docker, 빌드 명령이 필요할 때 |
| `/프론트가이드` | React 컴포넌트 작성, 무한루프 방지, 디자인 시스템 참조 시 |
| `/상태저장` | 세션 종료 전 PROJECT_STATUS.md 업데이트 시 |
| `/상태복원` | 새 세션 시작 시 이전 작업 이어받기 |
| `/인사이트` | 프로젝트 분석/인사이트 조회 시 |
| `/병렬작업` | 병렬 에이전트 실행 시 (중간보고 프로토콜, max_turns 가이드) |

## 프로젝트 개요

- **프로젝트명**: MsspBizCenter - MSSP 비즈니스 센터 (팀 업무포털)
- **핵심 기능**: Task(업무 일지), Meeting(회의록), Contract(계약관리)
- **현재 버전**: VERSION 파일 참조
- **기술 스택**: NestJS 10 + Next.js 15 + TypeORM + PostgreSQL 16 + Redis 7 + Tailwind CSS
- **Monorepo**: pnpm 9 + Turborepo 2 (apps/backend, apps/frontend, packages/shared)
- **디자인**: Soft Neo-Brutalism (border-2 + hard shadow + rounded-md)

## 멀티테넌시 및 보안

- 모든 데이터는 `tenant_id`로 격리
- JWT에 `tenantId` 포함
- 계약 금액은 AES-256-GCM 암호화 저장
- 역할별 접근 권한 (Owner/Admin/Editor/Analyst/Viewer)

## 위임 규칙

### 위임해야 할 때 (서브에이전트 사용)
- 다중 파일 구현/리팩토링 (3파일 이상)
- 코드 리뷰, 보안 감사, 성능 분석
- 전문 도메인 (보안, 데이터 분석, 시각화)
- 병렬 실행 가능한 독립 작업

### 직접 수행할 때
- 단일 파일 수정, 간단한 확인
- 상태 체크, git 명령
- 순차 의존성이 강한 작업

### 코드 변경 라우팅
- 실질적 코드 변경 → Backend/Frontend 에이전트에 위임
- 설계/분석만 → PM 에이전트 (코드 수정 안 함)
- `.claude/`, `CLAUDE.md`, `docs/` → 직접 수정 가능

## 모델 라우팅

| 모델 | 용도 | 예시 |
|------|------|------|
| **haiku** | 빠른 검색, 단순 체크, 가벼운 스캔 | 파일 목록 조회, 간단한 코드 검색, 포맷 확인 |
| **sonnet** | 표준 구현, 디버깅, 리뷰 | 기능 개발, 버그 수정, 코드 리뷰 |
| **opus** | 아키텍처 설계, 심층 분석, 복잡한 리팩토링 | PM 기획, 보안 감사, 대규모 구조 변경 |

Task() 호출 시 model 파라미터 명시:
- 단순 탐색: `model="haiku"`
- 기능 구현: `model="sonnet"` (기본값)
- 설계/분석: `model="opus"`

## 검증 프로토콜

### 완료 선언 전 필수 확인
1. **빌드 통과**: `pnpm build` 에러 0개
2. **린트 통과**: TypeScript 컴파일 에러 없음
3. **테스트 통과**: 관련 테스트 실행 및 통과
4. **증거 제시**: 빌드/테스트 출력을 실제로 확인 (추정 금지)

### 검증 규모별 가이드
- 소규모 (<5파일): 빌드 확인만
- 중규모 (5-15파일): 빌드 + 테스트
- 대규모 (15파일+): 빌드 + 테스트 + QA 에이전트 검증

### 프로젝트 검증 명령어
- 전체 빌드: `pnpm build`
- 백엔드 테스트: `cd apps/backend && pnpm test`
- 프론트엔드 빌드: `cd apps/frontend && pnpm build`
- 타입 체크: `pnpm -r exec tsc --noEmit`

## 서브에이전트 운영 지침

### 호칭 규칙
- **사용자(PO)**: "캡틴" (최종 의사결정권자)
- **PM(박서연)**: 이름 또는 "PM" (태스크 조율)

### 페르소나

| 역할 | 이름 | 담당 |
|------|------|------|
| PM | 박서연 | 요구사항, 태스크 분배, 병렬 작업 조율 |
| Backend | 박안도 | API, DB, 서버 로직 |
| Frontend | 유아이 | UI/UX, 컴포넌트 |
| DevOps | 배포준 | CI/CD, 인프라 |
| QA | 나검수 | 테스트, 품질 보증 |
| Docs | 문서인 | 매뉴얼, API 문서, 릴리스 노트 |
| Security | Chloe O'Brian | 보안, 암호화, 접근 제어 |
| Data Analyst | 이지표 | KPI/메트릭스 |
| Visualization | 송대시 | 차트/그래프 |

### 병렬 처리 원칙

**[필수] 모든 사용자 요청에 대해 병렬 처리를 기본으로 수행한다.**

- **병렬 가능**: Backend+Frontend (API 스펙 동일 시), 코드+테스트, 기능+문서
- **병렬 불가**: 순차 의존성 (DB→Entity→Service→Controller), 동일 파일 수정

## 관련 프로젝트

- **CTEM**: `/home/wynne/othaisan/CTEM/` - 보안 위협 관리 플랫폼 (코드 재활용)
- **미시시피**: https://mssp.leaked.id - 기존 MSSP 업무포털 (향후 SSO 통합)

## 참고

- **상세 기획**: [docs/design/planning.md](docs/design/planning.md)
- **프로젝트 상태**: [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **현재 버전**: [VERSION](VERSION)
