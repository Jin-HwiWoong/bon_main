import type OpenAI from "openai";

export type ChatMessages = OpenAI.Chat.Completions.ChatCompletionMessageParam[];

export type LlmUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type LlmCost = {
  prompt_cost?: number;
  completion_cost?: number;
  total_cost?: number;
};
