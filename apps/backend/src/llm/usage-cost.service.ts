import { Injectable } from "@nestjs/common";
import { appConfig } from "../config";
import type { LlmCost, LlmUsage } from "./llm.types";

@Injectable()
export class UsageCostService {
  calculate(usage?: LlmUsage): LlmCost | undefined {
    if (!usage) {
      return undefined;
    }

    const promptCost =
      usage.prompt_tokens !== undefined ? (usage.prompt_tokens / 1000) * appConfig.llmPromptCostPer1k : undefined;
    const completionCost =
      usage.completion_tokens !== undefined
        ? (usage.completion_tokens / 1000) * appConfig.llmCompletionCostPer1k
        : undefined;

    return {
      prompt_cost: promptCost,
      completion_cost: completionCost,
      total_cost:
        promptCost !== undefined || completionCost !== undefined ? (promptCost || 0) + (completionCost || 0) : undefined
    };
  }
}
