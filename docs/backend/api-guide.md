# API 가이드

이 문서는 현재 Nest API와 Next 프록시 기준의 최신 계약을 설명한다.

## 공통

- Nest API 예시 주소: `http://localhost:4000`
- 브라우저는 Nest API를 직접 호출하지 않고 `apps/frontend/app/api/*` 프록시를 경유한다.
- 일반 JSON 성공 응답은 raw DTO다.
- 에러 응답은 `{ ok: false, message, statusCode, path, timestamp }` 형식이다.
- SSE는 JSON 응답이 아니라 이벤트 스트림이다.

## 인증

현재 인증은 세션 쿠키 기반이다.

브라우저 플로우:

1. 프론트가 `/api/auth/verify` 호출
2. Next Route Handler가 Nest `/auth/admin/login` 또는 `/auth/branch/login`으로 프록시
3. Nest가 세션 쿠키를 발급
4. `app/layout.tsx`와 보호 segment layout이 서버에서 쿠키 기준 세션을 확인
5. 이후 요청은 쿠키 기반으로 권한을 검사

Nest 엔드포인트:

- `POST /auth/admin/login`
- `POST /auth/branch/login`
- `POST /auth/logout`
- `GET /auth/me`

프론트 프록시 엔드포인트:

- `POST /api/auth/verify`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## 헬스체크

### `GET /healthz`

```json
{ "status": "ok" }
```

## 인증 관련

### `POST /api/auth/verify`

```json
{
  "mode": "admin" | "user",
  "identifier": "string",
  "password": "string"
}
```

성공 시:

```json
{
  "role": "admin" | "branch",
  "adminId": 1,
  "branchId": 2,
  "branchCode": "BR001",
  "branchName": "강남점"
}
```

### `GET /api/auth/me`

성공 시:

```json
{
  "role": "branch",
  "branchId": 2,
  "branchCode": "BR001",
  "branchName": "강남점"
}
```

또는 비로그인 상태에서:

```json
null
```

### `POST /api/auth/logout`

```json
{ "success": true }
```

## 지점 채팅

### `GET /api/chat-sessions`

```json
[
  {
    "id": 1,
    "title": "보관 온도 문의",
    "last_message_at": "2026-03-11T11:00:00.000Z",
    "created_at": "2026-03-11T10:55:00.000Z"
  }
]
```

### `POST /api/chat-sessions`

```json
{ "title": "새 대화" }
```

### `GET /api/chat-sessions/:id/messages`

```json
[
  {
    "id": 10,
    "session_id": 1,
    "role": "user",
    "content": "질문 내용",
    "references": null,
    "fallback_to_sm": null,
    "created_at": "2026-03-11T11:00:00.000Z"
  }
]
```

### `POST /api/user/chat`

```json
{
  "question": "질문 내용",
  "session_id": 1
}
```

```json
{
  "session_id": 1,
  "answer": "답변 내용",
  "fallback_to_sm": false,
  "references": [
    { "article_id": 123, "category_code": "STORAGE", "title": "냉장 보관" }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  },
  "cost": {
    "prompt_cost": 0,
    "completion_cost": 0,
    "total_cost": 0
  }
}
```

### `POST /api/user/chat/stream`

요청:

```json
{
  "question": "질문 내용",
  "session_id": 1
}
```

응답 헤더:

```text
Content-Type: text/event-stream
```

이벤트:

- `meta`
  - `{"session_id":1,"fallback_to_sm":false,"references":[...]}`
- `chunk`
  - `{"text":"..."}`
- `usage`
  - `{"usage":{...},"cost":{...}}`
- `end`
  - `{}` 또는 usage/cost 포함
- `error`
  - `{"message":"내부 오류가 발생했습니다."}`

## 관리자

### `GET /api/admin/branches`

```json
[
  {
    "id": 1,
    "code": "BR001",
    "name": "강남점",
    "is_active": true,
    "last_login_at": null,
    "created_at": "2026-03-11T10:00:00.000Z",
    "updated_at": "2026-03-11T10:00:00.000Z"
  }
]
```

### `GET /api/admin/categories`

```json
[
  {
    "id": "1",
    "code": "STORAGE",
    "name": "보관",
    "description": "...",
    "sort_order": 0,
    "is_active": true,
    "article_count": "12"
  }
]
```

### `GET /api/admin/articles`

Query:

- `category_id`
- `is_published`
- `page`
- `page_size`

```json
{
  "items": [
    {
      "id": 1,
      "category_id": 2,
      "title": "문서 제목",
      "content": "본문",
      "summary": "요약",
      "priority": 0,
      "requires_sm": false,
      "is_published": true
    }
  ],
  "total": 12
}
```

### `GET /api/admin/articles/:id`

```json
{
  "id": 1,
  "category_id": 2,
  "title": "문서 제목",
  "content": "본문",
  "summary": "요약",
  "priority": 0,
  "requires_sm": false,
  "is_published": true
}
```

### `POST /api/admin/preview-chat`

```json
{ "question": "질문 내용" }
```

```json
{
  "answer": "답변 내용",
  "fallback_to_sm": false,
  "references": [ ... ],
  "usage": { ... },
  "cost": { ... },
  "used_chunks": [ ... ]
}
```

### `GET /api/admin/chat-sessions/branches/:branchId`

지점별 세션 목록 조회.

### `GET /api/admin/chat-sessions/branches/:branchId/:sessionId/messages`

지점 특정 세션의 메시지 목록 조회.

## 관련 문서

- `docs/backend/nest-structure.md`
- `docs/frontend/next-structure.md`
