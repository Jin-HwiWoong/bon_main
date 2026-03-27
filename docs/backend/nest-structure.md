# NestJS 구조 문서

이 문서는 `apps/backend`의 현재 NestJS 구조를 코드 기준으로 설명한다.

## 목표

- Controller는 HTTP 입출력만 담당한다.
- Service는 유스케이스 orchestration을 담당한다.
- Repository는 DB 접근을 담당한다.
- Provider는 OpenAI 같은 외부 연동을 담당한다.
- 공통 계약은 `packages/contracts`, 엔티티 타입은 `packages/entities`, 스키마는 `packages/db`를 사용한다.

## 부트스트랩

엔트리 파일은 `src/main.ts`다.

순서:

1. `NestFactory.create(AppModule)`
2. `express-session` 적용
3. CORS 적용
4. 전역 `ValidationPipe`
5. 전역 `ApiExceptionFilter`
6. `listen`

현재 상태:

- 세션 store는 PostgreSQL 기반 `connect-pg-simple`를 사용한다.
- env 파싱과 검증은 `src/config/index.ts`에서 수행하고, 결과는 불변 singleton `appConfig`로 고정한다.
- 운영 기준으로는 세션 prune 정책과 테스트 보강이 남은 과제다

## AppModule

`src/app.module.ts`에서 다음 모듈을 조립한다.

- `DrizzleModule`
- `LlmModule`
- `AuthModule`
- `BranchModule`
- `ChatSessionModule`
- `CategoryModule`
- `ArticleModule`
- `ChatModule`

env 로딩:

- `apps/backend/.env`
- 현재 작업 디렉터리의 `.env`

## 디렉터리 구조

```text
src/
  features/
    auth/
    branch/
    category/
    article/
    chat/
    chat-session/
  llm/
  common/
  config/
  infrastructure/database/
  infrastructure/vector/
  utils/
```

## 공통 계층

### `common/decorators`

- `CurrentUser`
  - 세션의 사용자 정보를 controller 파라미터로 꺼낸다.

### `common/guards`

- `AdminSessionGuard`
- `BranchSessionGuard`

역할 기반 접근 제어를 controller 레벨에 둔다.

### `common/filters`

- `ApiExceptionFilter`
  - 모든 예외를 `{ ok: false, message, statusCode, path, timestamp }` 형식으로 정규화한다.

### `common/types`

- `auth-session.d.ts`
  - `express-session`의 `SessionData.user` 타입 확장
- `request-with-session.ts`
  - 세션이 붙은 request 타입 alias

## 인프라 계층

### `DrizzleModule`

역할:

- `pg.Pool` 생성
- Drizzle DB 인스턴스 생성
- provider export

토큰:

- `PG_POOL`
- `DRIZZLE_DB`

### `LlmModule`

역할:

- OpenAI client 생성
- 임베딩 / 챗 completion provider 제공

포함 provider:

- `EmbeddingsProvider`
- `ChatCompletionProvider`
- `UsageCostService`

### `VectorModule`

역할:

- pgvector 전용 raw SQL 경계 제공
- 문서 chunk 저장과 RAG 검색을 공통 repository로 캡슐화

포함 provider:

- `KnowledgeBaseVectorRepository`

## 도메인 모듈

### `AuthModule`

- `AuthController`
- `AuthRepository`
- `AuthService`

역할:

- 관리자 로그인
- 지점 로그인
- 로그아웃
- 현재 세션 사용자 조회

### `BranchModule`

- `BranchController`
- `BranchService`
- `BranchRepository`

역할:

- 관리자 지점 목록 조회
- 지점 생성 / 수정

라우트:

- `/admin/branches`

### `CategoryModule`

- `CategoryController`
- `CategoryService`
- `CategoryRepository`

역할:

- 카테고리 CRUD
- 카테고리별 article count 조회

### `ArticleModule`

- `ArticleController`
- `ArticleService`
- `ArticleRepository`
- `ArticleIngestionService`

역할:

- 문서 CRUD
- 문서 저장 시 chunk 분할
- 임베딩 생성 및 `KnowledgeBaseVectorRepository`를 통한 `kb_chunk` 갱신

### `ChatSessionModule`

- `ChatSessionController`
- `ChatSessionAdminController`
- `ChatSessionService`
- `ChatSessionRepository`

역할:

- 지점 세션 목록 / 메시지 목록 / 메시지 생성
- 관리자 지점별 대화 조회

최근 정리:

- 세션/메시지 DB 접근을 `ChatSessionRepository`로 분리했다.

### `ChatModule`

- `ChatController`
- `ChatPreviewController`
- `ChatOrchestratorService`
- `ChatService`
- `PromptBuilderService`
- `RagRetrieverService`

역할:

- 지점 일반 챗
- 지점 SSE 스트리밍 챗
- 관리자 프리뷰 챗

구조:

- `ChatController`는 HTTP/SSE 응답만 담당한다.
- `ChatOrchestratorService`는 세션 생성, 메시지 저장, 답변 저장을 담당한다.
- `ChatService`는 RAG 검색 결과를 바탕으로 LLM 호출만 담당한다.

흐름:

1. 질문 수신
2. 세션 생성 또는 기존 세션 사용
3. 사용자 메시지 저장
4. RAG 검색
5. 프롬프트 조립
6. OpenAI 호출
7. assistant 메시지 저장
8. JSON 또는 SSE 응답

## DTO / Validation

- controller 입력은 DTO 클래스로 받는다.
- global `ValidationPipe`가 `whitelist`, `forbidNonWhitelisted`, `transform`를 적용한다.
- path/query 숫자는 `ParseIntPipe` 또는 implicit conversion으로 처리한다.

## 응답 전략

- 일반 JSON 성공 응답은 controller가 raw DTO를 직접 반환한다.
- 에러는 전역 filter가 `{ ok: false, ... }`로 반환한다.
- SSE는 `meta/chunk/usage/end/error` 이벤트를 사용한다.

## 현재 장점

- 모듈 경계가 비교적 명확하다.
- OpenAI / DB / RAG / CRUD 흐름이 분리돼 있다.
- raw SQL은 vector 전용 repository로 격리돼 있다.
- 관리자 라우트 prefix가 일관된다.
- 프론트와 계약이 `@bon/contracts`로 맞춰진다.

## 남은 리스크

- 커밋되지 않는 민감 env 파일이 `src/config/.env`에 남아 있다.
- 세션 테이블 운영 정책과 prune 전략은 아직 단순 기본값이다.
- HTTP/E2E 회귀 테스트는 아직 없다.

## 다음 권장 작업

1. `src/config/.env` 정리 및 비밀값 rotate
2. 세션 prune/운영 정책 점검
3. HTTP 회귀 테스트 추가
4. E2E 테스트 추가
