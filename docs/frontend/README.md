# apps/frontend

현재 프론트엔드는 Next.js App Router 기반이다.

## 역할

- 로그인 진입 화면
- 관리자 화면
  - 지점 계정 관리
  - 카테고리 / 문서 관리
  - 프리뷰 챗
  - 지점별 대화 조회
- 지점 화면
  - 채팅
  - 세션 목록
  - 메시지 조회

## 구조 원칙

- 브라우저는 Nest API를 직접 호출하지 않는다.
- `app/api/*` Route Handler가 프록시 계층을 맡는다.
- `/admin/*`, `/chat`은 Next 서버 layout이 먼저 접근을 차단한다.
- `AuthProvider`는 서버가 확인한 세션을 hydration하고, 필요할 때 `/api/auth/me`로 다시 복구한다.
- 공통 계약 타입은 `@bon/contracts`를 사용한다.

상세 구조는 [next-structure.md](./next-structure.md)를 참고한다.

## 실행

루트에서:

```bash
npm run dev:frontend
```

워크스페이스에서:

```bash
npm run dev
```

기본 개발 포트:

- Next: `http://localhost:3000`
- Nest API: `http://localhost:4000`

린트:

```bash
npm run lint
```

## 환경 변수

선택적으로 다음 값을 설정할 수 있다.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

초기 설정:

```bash
cp .env.example .env.local
```

설정하지 않으면 기본값 `http://localhost:4000`을 사용한다.

## 현재 주의점

- production build는 `next build --webpack` 기준으로 검증한다.
- 성공 응답은 raw DTO이고, 에러 응답만 `{ ok: false, ... }` 형식이다.
- `/api/auth/verify`는 프론트 전용 로그인 프록시 이름이고, 실제 Nest 엔드포인트는 `/auth/admin/login`, `/auth/branch/login`이다.
- 최종 권한 검사는 여전히 Nest guard가 맡고, Next는 페이지 접근 UX를 먼저 정리하는 역할이다.

## 관련 문서

- [루트 README](../../README.md)
- [배포 가이드](../backend/deployment.md)
- [API 가이드](../backend/api-guide.md)
- [Nest 구조 문서](../backend/nest-structure.md)
