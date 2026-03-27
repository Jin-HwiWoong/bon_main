# apps/frontend 구조 문서

## 개요

`apps/frontend`는 Next.js App Router 기반 프론트엔드다.  
브라우저는 직접 Nest API를 호출하지 않고, Next Route Handler를 프록시 계층으로 사용한다.

핵심 원칙:

- 화면은 `app/` 아래 페이지 단위로 구성한다.
- `/admin/*`, `/chat`은 서버 layout에서 role을 먼저 검사하고 `redirect()`한다.
- 브라우저 인증 상태는 `AuthProvider`가 서버 초기 세션을 hydration하고, 필요할 때 `/api/auth/me`를 통해 복구한다.
- 백엔드 호출은 가능하면 `app/api/*`를 통해 프록시한다.
- 공통 타입은 로컬 정의 대신 `@bon/contracts`를 사용한다.
- 성공 응답은 raw DTO를 사용하고, 에러 응답만 `{ ok: false, ... }` 형식을 사용한다.

## 최상위 폴더

```text
apps/frontend/
  app/
  components/
  lib/
  public/
  types/
```

## 1. `app/`

App Router의 실제 라우트와 API 프록시가 들어 있다.

### 1.1 페이지 라우트

```text
app/
  layout.tsx
  page.tsx
  admin/layout.tsx
  chat/page.tsx
  chat/layout.tsx
  admin/page.tsx
  admin/categories/page.tsx
  admin/articles/page.tsx
  admin/branches/page.tsx
  admin/chat-sessions/page.tsx
```

역할:

- `page.tsx`
  - 홈
  - 관리자/지점 로그인 진입
  - 이미 로그인된 사용자는 서버에서 `/admin` 또는 `/chat`으로 즉시 이동
- `admin/layout.tsx`
  - 관리자 세그먼트 서버 가드
- `chat/layout.tsx`
  - 지점 세그먼트 서버 가드
- `chat/page.tsx`
  - 지점 사용자 채팅 화면
  - 세션 목록, 메시지 목록, SSE 채팅 처리
- `admin/page.tsx`
  - 관리자 대시보드
- `admin/categories/page.tsx`
  - 카테고리 CRUD
- `admin/articles/page.tsx`
  - 문서 목록/검색
- `admin/branches/page.tsx`
  - 지점 계정 관리
- `admin/chat-sessions/page.tsx`
  - 지점별 대화 조회

### 1.2 API 프록시 라우트

```text
app/api/
  auth/
  admin/
  user/
  chat-sessions/
```

역할:

- `app/api/auth/*`
  - 로그인, 로그아웃, 세션 확인 프록시
  - `/api/auth/verify`는 Nest `/auth/admin/login` 또는 `/auth/branch/login`으로 변환한다.
- `app/api/admin/*`
  - 관리자용 카테고리/문서/지점/대화 조회 프록시
- `app/api/user/*`
  - 지점용 채팅/스트리밍 프록시
- `app/api/chat-sessions/*`
  - 지점 세션 목록/메시지 목록 프록시

### 1.3 레이아웃

- `app/layout.tsx`
  - 전역 CSS 적용
  - `ToastProvider`
  - `AuthProvider`
- `app/admin/layout.tsx`
  - 관리자 role 확인 후 서버 redirect
- `app/chat/layout.tsx`
  - 지점 role 확인 후 서버 redirect

즉, 모든 화면은 기본적으로 토스트와 인증 컨텍스트를 공유한다.

## 2. `components/`

화면 조립에 쓰는 클라이언트 컴포넌트들이다.

```text
components/
  admin/
  auth/
  ui/
```

### 2.1 `components/auth/`

- `auth-provider.tsx`
  - 서버 초기 세션 hydration
  - 세션 복구
  - 로그인 상태 저장
  - `useAuth`, `useRequireAuth`
- `password-modal.tsx`
  - 관리자/지점 로그인 입력 모달
- `logout-button.tsx`
  - 공통 로그아웃 버튼

### 2.2 `components/admin/`

- `preview-chat-modal.tsx`
  - 관리자 프리뷰 챗 UI

### 2.3 `components/ui/`

- `button.tsx`
- `card.tsx`
- `input.tsx`
- `modal.tsx`
- `toast.tsx`

재사용 가능한 최소 UI 컴포넌트 계층이다.

## 3. `types/`

```text
types/
  index.ts
```

역할:

- 프론트에서 자주 쓰는 타입 alias를 재수출한다.
- 실제 소스는 `@bon/contracts` 기반이다.
- 현재 `UserRole = "admin" | "user"` 같은 프론트 표현도 여기서 관리한다.

## 4. `lib/`

```text
lib/
  api/
  server/
  server-auth.ts
  utils.ts
```

역할:

- `api/*`
  - 브라우저에서 `/api/*`를 호출하는 공통 client 계층
- `server/backend-client.ts`
  - Route Handler와 서버 컴포넌트가 공유하는 Nest transport 계층
  - 쿠키 전달, JSON 응답 변환, 백엔드 base URL 관리
- `server-auth.ts`
  - 서버에서 쿠키를 읽고 `server/backend-client.ts`를 통해 Nest `/auth/me` 조회
  - role 기반 서버 redirect helper 제공
- UI나 컴포넌트 보조 유틸
- 프레임워크 비의존 로직은 가능하면 `packages/utils`로 올리는 게 우선이다.

## 5. 인증 흐름

### 5.1 로그인

1. 홈에서 역할 선택
2. `PasswordModal`이 `/api/auth/verify` 호출
3. Next API가 Nest `/auth/admin/login` 또는 `/auth/branch/login`으로 프록시
4. Nest가 세션 쿠키 발급
5. 프론트는 `AuthProvider.setAuthenticated()`로 UI 상태 갱신
6. 이후 보호 라우트는 서버 layout이 먼저 role을 검사한다

### 5.2 세션 복구

1. 앱 로드
2. `app/layout.tsx`가 서버에서 Nest `/auth/me`를 조회
3. `AuthProvider`가 초기 세션을 hydration
4. 보호 라우트는 각 segment layout이 서버에서 `redirect()` 처리
5. `useRequireAuth`는 클라이언트 보조 상태와 UX를 담당

### 5.3 로그아웃

1. `LogoutButton` 클릭
2. `/api/auth/logout` 호출
3. 서버 세션 제거
4. 브라우저 로컬 상태 제거
5. 홈으로 이동

## 6. 채팅 흐름

### 6.1 지점 채팅

1. `chat/page.tsx` 진입
2. `/api/chat-sessions`로 기존 세션 목록 조회
3. 세션 선택 시 `/api/chat-sessions/:id/messages` 조회
4. 질문 전송 시 `/api/user/chat/stream` 호출
5. SSE `meta/chunk/end` 이벤트를 파싱해 메시지 갱신
6. 응답 후 세션 목록 재조회

### 6.2 관리자 대화 조회

1. `/admin/chat-sessions`
2. `/api/admin/branches`로 지점 조회
3. `/api/admin/chat-sessions/branches/:branchId`로 세션 조회
4. `/api/admin/chat-sessions/branches/:branchId/:sessionId/messages`로 메시지 조회

## 7. 현재 구조의 장점

- 브라우저가 백엔드 URL/쿠키 세부사항을 직접 알 필요가 없다.
- 세션 인증과 프록시 로직이 `app/api`에 모인다.
- 브라우저 fetch 중복은 `lib/api/*`로 모이고, 서버 transport는 `lib/server/backend-client.ts`로 통일된다.
- 보호 라우트는 서버에서 먼저 차단되고, 클라이언트는 hydration된 세션을 사용한다.
- 공통 타입을 `@bon/contracts`에서 가져와 프론트/백엔드 계약이 맞춰진다.

## 8. 현재 구조의 주의점

- App Router page와 API route가 같은 `app/` 아래 있어 파일 구조가 섞여 보일 수 있다.
- SSE 처리는 `chat/page.tsx`에 로직이 많으므로, 추후 `hooks`나 전용 parser 유틸로 분리할 여지가 있다.
- 문서 목록 API는 raw 객체 `{ items, total }`를 반환하므로 일반 배열 리스트 API와 응답 모양이 다르다.

## 9. 다음 개선 후보

- 채팅 SSE 파서 훅 분리
- 관리자 화면용 데이터 훅 정리
- E2E 테스트 추가
