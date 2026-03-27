import { Module } from "@nestjs/common";
import { ChatSessionModule } from "../chat-session/chat-session.module";
import { VectorModule } from "../../infrastructure/vector/vector.module";
import { LlmModule } from "../../llm/llm.module";
import { ChatController } from "./chat.controller";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { ChatPreviewController } from "./chat.preview.controller";
import { PromptBuilderService } from "./prompt-builder.service";
import { RagRetrieverService } from "./rag-retriever.service";
import { ChatService } from "./chat.service";

@Module({
  imports: [LlmModule, ChatSessionModule, VectorModule],
  controllers: [ChatController, ChatPreviewController],
  providers: [ChatService, ChatOrchestratorService, PromptBuilderService, RagRetrieverService]
})
export class ChatModule {}
