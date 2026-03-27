# packages 문서

공통 패키지는 프론트엔드와 백엔드가 함께 사용하는 계약과 기반 코드를 담는다.

## 구성

- `packages/contracts`
  - API 요청/응답 계약 타입
- `packages/entities`
  - 인증/콘텐츠/채팅 관련 공통 엔티티 타입
- `packages/db`
  - Drizzle schema, migration, DB 타입
- `packages/utils`
  - 순수 유틸 함수

## 관련 문서

- [프로젝트 명세](./specification.md)
- [마이그레이션 현황](./migration-plan.md)
