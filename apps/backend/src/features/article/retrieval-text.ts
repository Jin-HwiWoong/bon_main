import type { ChatMessages } from "../../llm/llm.types";
import { extractPlainTextFromMarkdown } from "../../utils/markdown";

export type RetrievalKind = "raw" | "summary";

export function buildArticleRetrievalSummaryMessages(params: {
  title: string;
  categoryCode: string;
  content: string;
}): ChatMessages {
  const plainContent = normalizeRetrievalText(params.content);

  return [
    {
      role: "system",
      content: `너는 사내 규정 검색 인덱스를 만드는 요약기다.
- 답변용 요약이 아니라 검색용 요약을 만든다.
- 원문에 없는 내용은 절대 추가하지 않는다.
- 금지사항, 허용 조건, 예외, 절차, 대상, 수치가 있으면 우선 보존한다.
- 핵심 명사와 정책 용어를 유지한다.
- 결과는 400~1200자 사이의 한국어 텍스트로 작성한다.
- 장황한 도입/결론 없이 바로 내용만 정리한다.
- 아래 형식을 최대한 유지한다.
제목: ...
카테고리: ...
적용대상: ...
핵심규정: ...
금지사항: ...
예외: ...
절차: ...
주의사항: ...`
    },
    {
      role: "user",
      content: `문서 제목: ${params.title}
카테고리 코드: ${params.categoryCode}

문서 원문:
${plainContent}`
    }
  ];
}

export function normalizeRetrievalText(text: string) {
  return extractPlainTextFromMarkdown(text).trim();
}
