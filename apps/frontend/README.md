# MsspBizCenter Frontend

React 19 + Vite + TypeScript 기반 MSSP 비즈니스 센터 프론트엔드

## 기술 스택

- **React 19**: 최신 React 버전
- **Vite 6**: 빠른 개발 서버 및 빌드
- **TypeScript**: 타입 안전성
- **React Router v7**: 라우팅
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Axios**: HTTP 클라이언트
- **Vitest**: 단위 테스트

## 주요 기능

- 📋 **업무 일지**: 주차별 Task 관리
- 📝 **회의록**: 회의 내용 및 Action Item 관리
- 📄 **계약 관리**: 계약 정보 및 만료 알림

## 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (http://localhost:3001)
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview

# 타입 체크
pnpm type-check

# 테스트
pnpm test

# 테스트 커버리지
pnpm test:coverage
```

## 환경 변수

`.env.example`을 `.env`로 복사하고 환경 변수를 설정하세요.

```bash
cp .env.example .env
```

필수 환경 변수:

```env
VITE_API_URL=http://localhost:4001/api/v1
```

## 프로젝트 구조

```
src/
├── App.tsx              # 메인 앱 및 라우터 설정
├── main.tsx             # 앱 진입점
├── index.css            # 글로벌 스타일
├── pages/               # 페이지 컴포넌트
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Tasks/
│   ├── Meetings/
│   └── Contracts/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   └── Card.tsx
├── context/            # React Context
│   └── AuthContext.tsx
├── services/           # API 클라이언트
│   └── api.ts
├── types/              # TypeScript 타입 정의
│   └── index.ts
└── lib/                # 유틸리티 함수
    └── utils.ts
```

## 인증

JWT 기반 인증을 사용합니다.

- 로그인 시 `access_token`과 `refresh_token`을 localStorage에 저장
- API 요청 시 자동으로 토큰 헤더에 포함
- 토큰 만료 시 자동 갱신 시도
- 갱신 실패 시 로그인 페이지로 리다이렉트

## API 프록시

Vite 개발 서버는 `/api` 경로를 백엔드 서버(`http://localhost:4001`)로 프록시합니다.

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4001',
      changeOrigin: true,
    },
  },
}
```

## 라이선스

Private
