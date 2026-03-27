# 본아이에프 운영 매뉴얼 RAG 챗봇

## 최신 프로젝트 명세

## 1. 목적

- 본아이에프 지점이 운영 매뉴얼을 직접 찾지 않아도 규정 기반 답변을 빠르게 받을 수 있게 한다.
- 본사는 지점 계정, 카테고리, 문서, 대화 이력을 한 시스템에서 관리한다.
- RAG 기반 챗봇으로 규정 준수율을 높이고 반복 문의를 줄인다.

## 2. 사용자와 권한

- 관리자(`admin`)
  - 관리자 로그인
  - 지점 계정 생성/수정/비활성화
  - 카테고리/문서 CRUD
  - 프리뷰 챗
  - 지점별 대화 세션/메시지 조회
- 지점(`branch`)
  - 지점 코드 또는 지점명 + 비밀번호 로그인
  - 운영 매뉴얼 챗봇 사용
  - 자신의 대화 세션 목록/메시지 조회

참고:
- `branch`는 `지점` 의미다.
- 개인 사용자 계정은 두지 않고 지점 공용 계정만 운영한다.
- 채팅 기록은 개인 단위가 아니라 지점 단위로 저장한다.

## 3. 현재 기술 스택

- 프론트엔드: Next.js App Router + TypeScript + Tailwind CSS
- 백엔드: NestJS
- 데이터베이스: PostgreSQL
- 벡터 검색: pgvector
- ORM/스키마: Drizzle ORM
- 인증: 세션 기반 인증
- LLM/임베딩: OpenAI
- 저장소 구조: npm workspace 기반 모노레포

## 4. 모노레포 구조

```text
/
  apps/
    backend/              # NestJS API
    frontend/             # Next.js 프론트엔드

  packages/
    entities/             # 공통 엔티티 타입
    contracts/            # API 요청/응답 계약
    utils/                # 순수 유틸
    db/                   # Drizzle schema / migration
```

규칙:

- `apps/frontend`는 `@bon/contracts`, `@bon/entities`, `@bon/utils`만 직접 사용한다.
- `apps/frontend`는 `@bon/db`를 import하지 않는다.
- `apps/backend`는 `@bon/db`와 공통 패키지를 함께 사용한다.

## 5. 데이터 모델

- `admins`
- `branches`
- `chat_sessions`
- `chat_messages`
- `kb_category`
- `kb_article`
- `kb_chunk`

설명:

- `kb_category`, `kb_article`, `kb_chunk`는 기존 데이터 보존을 위해 기존 테이블명을 그대로 사용한다.
- 신규 인증/채팅 도메인만 `admins`, `branches`, `chat_sessions`, `chat_messages`를 추가했다.

## 6. 인증과 세션

- 기존 `X-Admin-Password`, `X-User-Password` 헤더 인증은 제거한다.
- 관리자와 지점 모두 로그인 후 세션 쿠키 기반으로 인증한다.
- `branches.code`와 `branches.name`은 모두 유니크하게 관리한다.
- 지점 로그인은 `지점 코드` 또는 `지점명` 둘 다 허용한다.
- 세션 사용자 모델:
  - `role`
  - `adminId` 또는 `branchId`
  - 필요 시 `branchCode`, `branchName`

현재 주요 API:

- `POST /auth/admin/login`
- `POST /auth/branch/login`
- `POST /auth/logout`
- `GET /auth/me`

## 7. 채팅 구조

- `chat_sessions`
  - 지점 단위 대화방
  - 첫 질문을 기반으로 제목 생성
- `chat_messages`
  - `role=user|assistant`
  - `content`
  - `references`
  - `fallback_to_sm`

지점 기능:

- 세션 목록 조회
- 메시지 목록 조회
- 스트리밍 챗
- 같은 세션에 메시지 누적

관리자 기능:

- 지점별 세션 목록 조회
- 세션별 메시지 조회

## 8. 현재 Nest 백엔드 구조

### 8.1 모듈

- `AuthModule`
- `BranchModule`
- `CategoryModule`
- `ArticleModule`
- `ChatModule`
- `ChatSessionModule`
- `LlmModule`
- `DrizzleModule`

### 8.2 계층 원칙

- `Controller`
  - HTTP 입력/출력 담당
  - DTO validation 적용
- `Service`
  - 도메인 유스케이스 orchestration 담당
- `Repository`
  - Drizzle/SQL 기반 데이터 접근 담당
- `Provider`
  - 외부 API adapter 담당

### 8.3 현재 분리 상태

- 외부 API 계층
  - `EmbeddingsProvider`
  - `ChatCompletionProvider`
  - `OPENAI_CLIENT` provider
- 정책/조립 계층
  - `PromptBuilderService`
  - `UsageCostService`
- 검색 계층
  - `KnowledgeBaseVectorRepository`
  - `RagRetrieverService`
- 문서 적재 계층
  - `ArticleIngestionService`
- CRUD/query 계층
  - `CategoryRepository`
  - `BranchRepository`
  - `ArticleRepository`

## 9. 응답/에러 정책

- 성공 응답:
  - 일반 JSON 응답은 raw DTO를 직접 반환한다.
- 전역 예외 응답:
  - `{ ok: false, message, statusCode, path, timestamp, errors? }`
- ValidationPipe:
  - `whitelist`
  - `forbidNonWhitelisted`
  - `transform`
  - `enableImplicitConversion`

예외:

- SSE 응답은 일반 JSON envelope를 사용하지 않는다.
- `POST /user/chat/stream`은 `meta/chunk/usage/end/error` 이벤트를 사용한다.

## 10. RAG 흐름

1. 관리자가 문서 등록/수정
2. 문서 내용을 chunk로 분할
3. 제목/청크 임베딩 생성
4. `kb_article`, `kb_chunk` 갱신
5. 지점이 질문
6. 질문 임베딩 생성
7. `KnowledgeBaseVectorRepository`가 pgvector 검색
8. `PromptBuilderService`가 정책 + context로 프롬프트 구성
9. `ChatCompletionProvider`가 OpenAI 호출
10. 답변과 참고 문서를 `chat_messages`에 저장

## 11. 프론트 구조

- Next API route가 Nest 백엔드 프록시 역할을 한다.
- `app/admin/layout.tsx`, `app/chat/layout.tsx`가 서버에서 role 기반 접근 제어를 담당한다.
- `AuthProvider`는 서버가 확인한 세션을 hydration하고, 필요할 때 `/api/auth/me`로 다시 복구한다.
- `useRequireAuth`는 클라이언트 보조 상태와 UX를 담당한다.
- 지점 화면:
  - 세션 목록
  - 현재 세션 메시지
  - 새 대화 시작
- 관리자 화면:
  - 지점 관리
  - 카테고리/문서 관리
  - 프리뷰 챗
  - 지점별 대화 조회

## 12. 현재 상태 요약

완료:

- 모노레포/workspace 구성
- 공통 패키지 구성
- Drizzle schema와 안전한 migration 구성
- NestJS 기반 인증/지점/카테고리/문서/채팅/세션 기능 구현
- 세션 인증 프론트 전환
- 채팅 세션 목록 및 관리자 대화 조회 UI
- 전역 validation, 예외 필터
- provider/service/repository 경계 1차 정리
- `ChatSessionRepository` 분리
- 성공 응답 raw DTO 방식 단일화
- `apps/backend` dev runner를 `ts-node-dev` 기반으로 정리

남은 큰 작업:

- HTTP 회귀 테스트 자동화
- 레거시 Express 완전 대체 전 parity 검증
- 운영 문서/README 세부 정리
- env validation / 세션 store 운영화
