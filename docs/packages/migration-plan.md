# 본아이에프 운영 매뉴얼 챗봇

## 마이그레이션 진행 현황

## 1. 완료된 단계

### 1.1 기준선 설계

완료 내용:

- `admin`, `branch` 권한 모델 확정
- 세션 인증 모델 확정
- `chat_sessions`, `chat_messages` 채팅 저장 구조 확정
- 모노레포 및 공통 패키지 경계 확정

### 1.2 모노레포 및 공통 패키지

완료 내용:

- root workspace 구성
- `apps/backend`와 `apps/frontend` 워크스페이스 정리
- `packages/entities`
- `packages/contracts`
- `packages/utils`
- `packages/db`
- 프론트 타입을 공통 계약 기준으로 이관

### 1.3 DB/Drizzle

완료 내용:

- `packages/db`에 Drizzle schema 구성
- 기존 `kb_*` 데이터 보존형 migration 구성
- `admins`, `branches`, `chat_sessions`, `chat_messages` 추가
- baseline migration 적용 완료

### 1.4 NestJS 전환

완료 내용:

- `apps/backend` 생성
- `AuthModule`
- `BranchModule`
- `CategoryModule`
- `ArticleModule`
- `ChatModule`
- `ChatSessionModule`
- `DrizzleModule`
- `LlmModule`

### 1.5 프론트 인증 전환

완료 내용:

- 비밀번호 헤더 인증 제거
- `AuthProvider`, `useRequireAuth` 도입
- 로그인 상태 복구
- 로그아웃 처리
- 관리자/지점 보호 라우트 적용

### 1.6 채팅 세션 UI

완료 내용:

- 지점 세션 목록/메시지 조회 UI
- 관리자 지점별 대화 조회 UI
- 세션 기반 대화 이어쓰기

### 1.7 구조 정리

완료 내용:

- 전역 `ValidationPipe`
- 전역 예외 필터
- OpenAI client provider 분리
- prompt builder 분리
- usage cost 계산 분리
- RAG 검색 repository/service 분리
- article ingestion service 분리
- category/branch/article repository 추가
- chat session/message repository 분리
- 성공 응답을 raw DTO 방식으로 통일
- `apps/backend` dev runner를 `ts-node-dev` 기반으로 정리

## 2. 현재 백엔드 구조 목표 대비 상태

현재 구조:

- Controller
  - 요청/응답 담당
- Service
  - 유스케이스 orchestration
- Repository
  - DB 접근
- Provider
  - 외부 API adapter

현재 평가:

- 초기 Express 이식 단계를 지나, Nest 구조화 1차 정리는 끝난 상태
- 특히 LLM/provider와 RAG 검색 계층은 이전보다 분리가 명확해짐
- CRUD 도메인에도 repository 패턴을 적용해 service 두께를 줄임

## 3. 남은 작업

### 3.1 회귀 검증

우선순위 높음:

- `GET /healthz`
- 관리자/지점 로그인 성공/실패
- `GET /auth/me`
- 권한 없는 접근 401
- 없는 문서 조회 404
- validation 400
- 채팅/세션/메시지 API 응답 형식 확인

### 3.2 프론트 실동작 검증

- 관리자 로그인
- 지점 생성
- 카테고리/문서 등록
- 지점 로그인
- 채팅 생성
- 세션 재열기
- 관리자 대화 조회

### 3.3 문서 정리

- 루트 README 최신화
- 프론트/백엔드 실행 가이드 통합
- 환경변수와 포트 정책 명시
- Nest 구조 문서 정리

### 3.4 테스트

- auth/controller 테스트
- branch/category/article service 테스트
- chat/session service 테스트
- 프론트 주요 플로우 smoke test

## 4. 삭제 보류 정책

- 기존 `bon` Express 앱 제거 완료
- 운영/개발 기준은 `apps/backend`와 `apps/frontend`만 유지한다.

## 5. 다음 추천 순서

1. HTTP 회귀 검증
2. 프론트 실플로우 검증
3. 문서/README 정리
4. 테스트 추가
5. 세션 store 외부화 및 env validation 추가
