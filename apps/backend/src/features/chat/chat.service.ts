import { Inject, Injectable } from "@nestjs/common";
import type { ChatReference } from "@bon/contracts";
import { ChatCompletionProvider } from "../../llm/chat-completion.provider";
import { UsageCostService } from "../../llm/usage-cost.service";
import { PromptBuilderService } from "./prompt-builder.service";
import { RagRetrieverService } from "./rag-retriever.service";
import type { RagChunk } from "./types";

@Injectable()
export class ChatService {
  constructor(
    @Inject(RagRetrieverService) private readonly ragRetrieverService: RagRetrieverService,
    @Inject(ChatCompletionProvider) private readonly chatCompletionProvider: ChatCompletionProvider,
    @Inject(UsageCostService) private readonly usageCostService: UsageCostService,
    @Inject(PromptBuilderService) private readonly promptBuilderService: PromptBuilderService
  ) {}

  async preview(question: string) {
    const { chunks, fallbackToSm, requiresSmExists } = await this.ragRetrieverService.retrieve(question);
    return { chunks, fallbackToSm, references: toReferences(chunks), requiresSmExists };
  }

  async getAnswer(question: string, opts?: { includeChunks?: boolean }) {
    const { chunks, fallbackToSm, requiresSmExists } = await this.ragRetrieverService.retrieve(question);
    // 검색 결과와 정책을 합쳐 LLM이 바로 소비할 메시지로 조합한다.
    const policyPrompt = this.promptBuilderService.buildPolicyPrompt(requiresSmExists, chunks.length > 0);
    const messages = this.promptBuilderService.buildChatMessages(question, chunks, policyPrompt);
    const { text: answer, usage } = await this.chatCompletionProvider.complete(messages);

    return {
      answer,
      fallback_to_sm: fallbackToSm || requiresSmExists,
      usage,
      cost: this.usageCostService.calculate(usage),
      references: toReferences(chunks),
      used_chunks: opts?.includeChunks ? chunks : undefined
    };
  }

  async streamAnswer(question: string) {
    const { chunks, fallbackToSm, requiresSmExists } = await this.ragRetrieverService.retrieve(question);
    const policyPrompt = this.promptBuilderService.buildPolicyPrompt(requiresSmExists, chunks.length > 0);
    const messages = this.promptBuilderService.buildChatMessages(question, chunks, policyPrompt);
    const { stream, usageRef: rawUsageRef } = await this.chatCompletionProvider.stream(messages);
    const usageRef: {
      value?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      cost?: {
        prompt_cost?: number;
        completion_cost?: number;
        total_cost?: number;
      };
    } = {};

    // 스트리밍 본문과 usage 집계를 같은 생명주기로 전달하기 위해 래퍼를 둔다.
    const wrapped = (async function* (
      source: AsyncIterable<string>,
      targetUsageRef: typeof usageRef,
      sourceUsageRef: typeof rawUsageRef,
      usageCostService: UsageCostService
    ) {
      for await (const chunk of source) {
        if (sourceUsageRef.value) {
          targetUsageRef.value = sourceUsageRef.value;
          targetUsageRef.cost = usageCostService.calculate(sourceUsageRef.value);
        }
        yield chunk;
      }

      if (sourceUsageRef.value) {
        targetUsageRef.value = sourceUsageRef.value;
        targetUsageRef.cost = usageCostService.calculate(sourceUsageRef.value);
      }
    })(stream, usageRef, rawUsageRef, this.usageCostService);

    return {
      stream: wrapped,
      usageRef,
      fallbackToSm: fallbackToSm || requiresSmExists,
      references: toReferences(chunks)
    };
  }
}

function toReferences(chunks: RagChunk[]): ChatReference[] {
  return chunks.map((chunk) => ({
    article_id: chunk.article_id,
    category_code: chunk.category_code,
    title: chunk.title
  }));
}
