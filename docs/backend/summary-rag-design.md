# Article Retrieval Field Design

## 목표

- 문서당 retrieval 인덱스는 1개만 가진다.
- 길이가 짧은 문서는 원문으로 검색한다.
- 길이가 긴 문서는 LLM 요약으로 검색한다.
- 별도 retrieval 테이블 없이 `kb_article` 필드에 직접 저장한다.
- 안정화되면 기존 `kb_chunk`를 제거할 수 있어야 한다.

## 핵심 결정

문서별 retrieval 데이터가 항상 1개라면, 별도 테이블보다 `kb_article` 컬럼 추가가 더 단순하다.

- 문서를 retrieval 용도로 다시 청크 분할하지 않는다.
- 문서당 retrieval 인덱스는 항상 1개다.
- 길이 기준으로 `raw` 또는 `summary`를 선택한다.
- `content`는 원본 소스 오브 트루스
- `retrieval_text`는 검색용 텍스트
- `retrieval_embedding`은 검색용 임베딩
- `retrieval_kind`는 `raw | summary`

즉 검색 인덱스는 `kb_article`에 붙는 1:1 파생 필드다.

## `kb_article` 확장안

기존 [`kb_article`](/Users/leeseungchan/무제 폴더/bon/packages/db/src/schema.ts#L125)에 아래 필드를 추가한다.

```sql
ALTER TABLE kb_article
ADD COLUMN IF NOT EXISTS retrieval_kind VARCHAR(16),
ADD COLUMN IF NOT EXISTS retrieval_text TEXT,
ADD COLUMN IF NOT EXISTS retrieval_embedding vector({{EMBEDDING_DIM}}),
ADD COLUMN IF NOT EXISTS retrieval_model VARCHAR(120),
ADD COLUMN IF NOT EXISTS retrieval_version VARCHAR(32),
ADD COLUMN IF NOT EXISTS retrieval_indexed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retrieval_error TEXT;

CREATE INDEX IF NOT EXISTS idx_kb_article_retrieval_kind
  ON kb_article (retrieval_kind);
```

필드 의미:

- `retrieval_kind`
  - `raw`: 원문을 그대로 retrieval text로 사용
  - `summary`: 요약을 retrieval text로 사용
- `retrieval_text`
  - 검색 전용 파생 텍스트
- `retrieval_embedding`
  - `retrieval_text` 임베딩
- `retrieval_model`
  - `raw`면 `raw`
  - `summary`면 실제 사용한 요약 모델명 기록
- `retrieval_version`
  - 정책 변경 시 재색인 기준
- `retrieval_indexed_at`
  - 마지막 색인 시각
- `retrieval_error`
  - 실패 사유 추적

## 적재 규칙

### 길이 기준

권장 환경 변수:

- `RAG_SUMMARY_MIN_CHARS=2400`
- `RAG_SUMMARY_MODEL=gpt-5.1`

### 규칙

- `content.length < RAG_SUMMARY_MIN_CHARS`
  - `retrieval_kind = 'raw'`
  - `retrieval_text = content`
- `content.length >= RAG_SUMMARY_MIN_CHARS`
  - `retrieval_kind = 'summary'`
  - `retrieval_text = LLM summary(content)`
  - 요약 호출 모델은 `RAG_SUMMARY_MODEL`

두 경우 모두 `retrieval_embedding = embed(retrieval_text)`다.

정리하면:

- 짧은 문서: 원문 + 임베딩
- 긴 문서: 요약 + 임베딩
- 청크 분할: 하지 않음

## 원본 필드와의 관계

- `content`
  - 문서 원본
  - 관리자 수정 화면, 운영 데이터, LLM 답변 컨텍스트의 기준값
- `retrieval_text`
  - 검색용 파생값
  - `content`에서 계산되는 secondary field
- `title_embedding`
  - 제목 검색용 보조 점수
- `retrieval_embedding`
  - 본문 검색용 주 점수

즉:

- 원본 데이터: `title`, `content`
- 파생 검색 인덱스: `title_embedding`, `retrieval_text`, `retrieval_embedding`

## 검색 전략

질문 임베딩 생성 후 `kb_article`에서 바로 검색한다.

권장 점수:

- `0.7 * retrieval_embedding_score + 0.3 * title_embedding_score`

필터 조건:

- `is_published = true`
- `deleted_at IS NULL`
- `retrieval_embedding IS NOT NULL`

즉 검색 쿼리는 더 이상 `kb_chunk`를 볼 필요가 없다.

## 답변 컨텍스트

프롬프트에는 계속 `content` 원문을 넣는다.

- `retrieval_kind = raw`
  - 검색은 원문 임베딩, 답변도 원문 기반
- `retrieval_kind = summary`
  - 검색은 요약 임베딩, 답변은 원문 기반

즉 역할 분리는 아래와 같다.

- 검색: `retrieval_text`
- 답변: `content`

이 구조에서는 긴 문서일수록 요약 품질이 검색 recall과 ranking에 영향을 주고, 실제 답변 내용은 여전히 원문 `content` 품질에 좌우된다.

## 요약 규칙

긴 문서 요약은 일반 요약이 아니라 retrieval 최적화 요약이어야 한다.

요약 호출 모델은 환경변수 `RAG_SUMMARY_MODEL`로 관리한다.

출력 요구:

- 원문에 없는 정보 추가 금지
- 금지사항, 허용 조건, 예외, 절차, 대상, 수치 우선 보존
- 핵심 명사와 정책 용어 유지
- 검색 가능한 밀도를 유지

권장 포맷:

```text
제목: {article title}
카테고리: {category_code}
적용대상: ...
핵심규정: ...
금지사항: ...
예외: ...
절차: ...
주의사항: ...
```

권장 길이:

- 400~1200자

## 저장 흐름

권장 순서:

1. `kb_article` 원본 필드 저장
2. `title_embedding` 계산
3. 길이 기준으로 `retrieval_kind` 결정
4. 필요 시 `RAG_SUMMARY_MODEL`로 LLM 요약 생성
5. `retrieval_text` 임베딩 생성
6. 같은 `kb_article` row에 retrieval 필드 업데이트

초기 rollout에서는 기존 `kb_chunk` 저장 로직을 당분간 같이 유지한다.

## 조회 흐름

권장 순서:

1. 질문 임베딩 생성
2. `kb_article.retrieval_embedding`으로 top-k 검색
3. 선택된 article의 `content` 원문을 읽음
4. 프롬프트에는 `title + content`를 넣음

즉 retrieval 인덱스는 검색 후보를 고르는 용도고, 최종 LLM 컨텍스트는 원문 article이다.

## 전환 전략

### 1단계. 컬럼 추가

- `kb_article`에 retrieval 관련 컬럼 추가

### 2단계. Shadow write

- 문서 저장 시 retrieval 필드도 함께 계산
- 검색은 아직 기존 `kb_chunk`

### 3단계. Backfill

- 기존 article 전체에 retrieval 필드 채우기

### 4단계. Read path 전환

- 검색을 `kb_article.retrieval_embedding` 기반으로 전환

### 5단계. `kb_chunk` 제거

- 신규 chunk write 중단
- chunk 조회 코드 제거
- migration으로 `kb_chunk` 삭제

## 환경 변수 제안

```env
RAG_RETRIEVAL_INDEX_ENABLED=false
RAG_RETRIEVAL_READ_ENABLED=false
RAG_SUMMARY_MIN_CHARS=2400
RAG_SUMMARY_MODEL=gpt-5.1
RAG_RETRIEVAL_TOP_K=5
RAG_RETRIEVAL_MIN_SCORE=0.45
RAG_RETRIEVAL_VERSION=v1
```

## 장점

- 구조가 가장 단순하다.
- 문서당 retrieval 데이터가 1개라는 가정과 정확히 맞다.
- 조회 시 join이 줄어든다.
- `title_embedding`과 동일한 패턴으로 관리할 수 있다.
- 검색 최적화와 답변 근거를 분리할 수 있다.
- 안정화 후 `kb_chunk`를 제거하기 쉽다.

## 리스크

- 긴 문서의 검색 품질이 요약 품질에 크게 의존한다.
- 문서당 retrieval unit이 1개라서, 긴 문서 내 세부 주제 검색은 recall이 떨어질 수 있다.
- 검색은 요약인데 답변은 원문 전체를 넣으므로, 프롬프트 길이 관리가 별도 과제가 된다.
- 추후 문서당 여러 retrieval unit이 필요해지면 별도 테이블로 다시 분리해야 한다.

## 결론

현재 요구사항이 `문서당 1개 retrieval 인덱스`라면 별도 summary 테이블보다 `kb_article`에 retrieval 필드를 넣는 쪽이 맞다. 구현도 단순하고, 짧은 문서는 원문 검색, 긴 문서는 요약 검색으로 가져가면서도, 최종 LLM 답변은 계속 원문 `content`를 기준으로 유지할 수 있다.
