# @bon/backend

현재 백엔드는 NestJS 기반 API다.

## 역할

- 관리자 로그인 / 지점 로그인 / 세션 복구
- 지점 계정 관리
- 카테고리 / 문서 CRUD
- RAG 기반 챗봇 응답
- 채팅 세션 / 메시지 저장 및 조회

## 실행

루트에서:

```bash
npm run dev:backend
```

워크스페이스에서:

```bash
npm run dev
```

현재 dev runner:

```bash
ts-node-dev --respawn --transpile-only src/main.ts
```

빌드:

```bash
npm run build
```

타입 검사:

```bash
npm run typecheck
```

린트:

```bash
npm run lint
```

환경 변수:

```bash
cp .env.example .env
```

- 개발/운영 공통 env 기준 파일은 `apps/backend/.env`다.
- 앱 런타임 env 파싱과 검증은 `src/config/index.ts`가 담당한다.
- DB migration과 admin seed 스크립트도 같은 파일을 기준으로 읽는다.

## 엔트리

- `src/main.ts`
  - Nest bootstrap
  - pg-backed session
  - CORS
  - global validation
  - global exception filter

- `src/app.module.ts`
  - 전체 모듈 조립

## 응답 원칙

성공 응답은 raw DTO를 그대로 반환한다.

에러:

```json
{
  "ok": false,
  "message": "...",
  "statusCode": 400,
  "path": "/...",
  "timestamp": "..."
}
```

예외:

- SSE 스트림은 일반 JSON 응답이 아니라 이벤트 스트림을 사용한다.

## 상세 문서

- [Nest 구조 문서](./nest-structure.md)
- [API 가이드](./api-guide.md)
- [배포 가이드](./deployment.md)
