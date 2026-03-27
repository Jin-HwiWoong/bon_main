import { Inject, Injectable } from "@nestjs/common";
import type { ChatRequest, ChatResponse } from "@bon/contracts";
import { ChatSessionService } from "../chat-session/chat-session.service";
import { ChatService } from "./chat.service";

@Injectable()
export class ChatOrchestratorService {
  constructor(
    @Inject(ChatService) private readonly chatService: ChatService,
    @Inject(ChatSessionService) private readonly chatSessionService: ChatSessionService
  ) {}

  async handleChat(branchId: number, body: ChatRequest): Promise<ChatResponse> {
    const sessionId = await this.ensureSession(branchId, body.session_id, body.question);

    await this.chatSessionService.createMessage(branchId, sessionId, {
      role: "user",
      content: body.question
    });

    const result = await this.chatService.getAnswer(body.question);

    await this.chatSessionService.createMessage(branchId, sessionId, {
      role: "assistant",
      content: result.answer,
      references: result.references,
      fallback_to_sm: result.fallback_to_sm
    });

    return {
      session_id: sessionId,
      ...result
    };
  }

  async handleStreamChat(branchId: number, body: ChatRequest) {
    const sessionId = await this.ensureSession(branchId, body.session_id, body.question);

    await this.chatSessionService.createMessage(branchId, sessionId, {
      role: "user",
      content: body.question
    });

    const { stream, usageRef, fallbackToSm, references } = await this.chatService.streamAnswer(body.question);
    let assistantText = "";
    const wrapped = this.wrapAssistantStream({
      branchId,
      sessionId,
      stream,
      fallbackToSm,
      references,
      onChunk: (chunk) => {
        assistantText += chunk;
      },
      getAssistantText: () => assistantText
    });

    return {
      sessionId,
      stream: wrapped,
      usageRef,
      fallbackToSm,
      references
    };
  }

  private async ensureSession(branchId: number, sessionId: number | undefined, question: string) {
    if (sessionId) {
      return sessionId;
    }

    const session = await this.chatSessionService.create(branchId, {
      title: buildSessionTitle(question)
    });

    return session.id;
  }

  private async *wrapAssistantStream(params: {
    branchId: number;
    sessionId: number;
    stream: AsyncIterable<string>;
    fallbackToSm: boolean;
    references: Array<{
      article_id: number;
      category_code: string;
      title?: string;
    }>;
    onChunk: (chunk: string) => void;
    getAssistantText: () => string;
  }) {
    for await (const chunk of params.stream) {
      params.onChunk(chunk);
      yield chunk;
    }

    await this.chatSessionService.createMessage(params.branchId, params.sessionId, {
      role: "assistant",
      content: params.getAssistantText(),
      references: params.references,
      fallback_to_sm: params.fallbackToSm
    });
  }
}

function buildSessionTitle(question: string) {
  const normalized = question.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 60);
}
