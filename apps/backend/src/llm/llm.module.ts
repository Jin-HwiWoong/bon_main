import { Module } from "@nestjs/common";
import OpenAI from "openai";
import { appConfig } from "../config";
import { ChatCompletionProvider } from "./chat-completion.provider";
import { EmbeddingsProvider } from "./embeddings.provider";
import { OPENAI_CLIENT } from "./llm.constants";
import { UsageCostService } from "./usage-cost.service";

@Module({
  providers: [
    {
      provide: OPENAI_CLIENT,
      // OpenAI SDK 인스턴스는 모듈에서 한 번만 만들고 adapter/provider들이 주입받아 사용한다.
      useFactory: () =>
        new OpenAI({
          apiKey: appConfig.openaiApiKey,
          baseURL: appConfig.openaiBaseUrl
        })
    },
    EmbeddingsProvider,
    ChatCompletionProvider,
    UsageCostService
  ],
  exports: [EmbeddingsProvider, ChatCompletionProvider, UsageCostService]
})
export class LlmModule {}
