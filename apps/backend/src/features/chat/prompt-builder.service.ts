import { Injectable } from "@nestjs/common";
import type { RagChunk } from "./types";
import type { ChatMessages } from "../../llm/llm.types";

const BASE_POLICY_PROMPT = `너는 본사 운영 규정 상담원이다. 다음 원칙을 반드시 지켜라.
- 각 청크의 제목과 본문을 함께 참고하고, 질문과 직접 연관된 내용만 근거로 짧고 단호하게 답한다. 청크에 없는 정보는 추측하지 않는다.
- 규정과 요청이 충돌하면 "규정상 불가합니다."라고 명확하게 답한다.
- 매출·레시피 등 민감 영역은 상세 수치/레시피를 주지 말고 문의 절차만 안내한다.
- 규정 청크가 전혀 없거나 질문과 무관하면 "해당 매장 관련 규정이 없어 안내가 어려워요. 담당 sm에게 문의 부탁드립니다."를 한 번만 덧붙인다.
- 중복된 사과나 반복 멘션 없이 2~4문장 이내로 간결히 답한다.`;

@Injectable()
export class PromptBuilderService {
  buildPolicyPrompt(requiresSmExists: boolean, hasChunks: boolean) {
    const extra: string[] = [];
    if (requiresSmExists) {
      extra.push('- 검색된 규정에 requires_sm=true가 포함되어 있으므로 반드시 "담당 sm에게 문의 부탁드립니다." 멘션을 답변에 포함한다.');
    }
    if (!hasChunks) {
      extra.push('- 규정 청크가 없으므로 모른다고 답하고 "담당 sm에게 문의 부탁드립니다."를 반드시 포함한다.');
    }

    return [BASE_POLICY_PROMPT, ...extra].join("\n");
  }

  buildChatMessages(question: string, contextChunks: RagChunk[], policyPrompt: string): ChatMessages {
    const contextText =
      contextChunks.length === 0
        ? "없음 (규정 청크가 제공되지 않았음)"
        : contextChunks
            .map((chunk, index) => {
              const title = chunk.title || "(제목 없음)";
              const requiresSm = chunk.requires_sm ? "Y" : "N";
              return `[${index + 1}] category=${chunk.category_code}, requires_sm=${requiresSm}
제목: ${title}
내용: ${chunk.content}`;
            })
            .join("\n\n");

    return [
      {
        role: "system",
        content: `${policyPrompt}
추가 지시:
- 먼저 사용자 질문을 이해한 뒤, 규정 청크에서 답변 근거를 찾는다.
- 규정 청크가 있으면 제목과 본문을 함께 참고해 질문과 직접 관련된 내용만 근거로 2~4문장 이내로 간결하게 답한다.
- 청크에 없는 정보는 추측하거나 만들어내지 않는다.
- 규정 청크가 없거나 무관하면 친절하게 "해당 매장 관련 규정이 없어 안내가 어려워요. 담당 sm에게 문의 부탁드립니다."라고 한 번만 덧붙인다.
- 중복된 사과/반복 멘션을 피한다.`
      },
      {
        role: "user",
        content: `사용자 질문: ${question}

검색된 규정 청크:
${contextText}

응답 지침:
- 질문을 먼저 이해/요약하고, 규정 청크의 제목과 본문 중 질문과 직접 관련된 부분만 근거로 사용해 답한다.
- 규정 청크가 있으면 그 근거(제목+본문)에 기반해 답한다.
- 규정 청크가 없거나 무관하면 모른다고 답하고 "담당 sm에게 문의 부탁드립니다."를 한 번만 덧붙인다.
- 규정 외 정보는 추측하지 말고 모른다고 답한다.`
      }
    ];
  }
}
