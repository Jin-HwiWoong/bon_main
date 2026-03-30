import { Inject, Injectable } from "@nestjs/common";
import type OpenAI from "openai";
import { appConfig } from "../config";
import { OPENAI_CLIENT } from "./llm.constants";
import type { ChatMessages, LlmUsage } from "./llm.types";

@Injectable()
export class ChatCompletionProvider {
  constructor(@Inject(OPENAI_CLIENT) private readonly client: OpenAI) {}

  async complete(
    messages: ChatMessages,
    options?: { model?: string }
  ): Promise<{ text: string; usage?: LlmUsage }> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? appConfig.llmModel,
      messages
    });

    const usage = response.usage
      ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        }
      : undefined;

    return {
      text: response.choices[0].message?.content || "",
      usage
    };
  }

  async stream(messages: ChatMessages): Promise<{
    stream: AsyncIterable<string>;
    usageRef: { value?: LlmUsage };
  }> {
    const stream = await this.client.chat.completions.create({
      model: appConfig.llmModel,
      messages,
      stream: true,
      stream_options: { include_usage: true }
    });

    const usageRef: { value?: LlmUsage } = {};

    const wrapped = (async function* () {
      for await (const chunk of stream) {
        if (chunk.usage) {
          const usage = chunk.usage;
          usageRef.value = {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens
          };
        }

        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    })();

    return { stream: wrapped, usageRef };
  }
}
