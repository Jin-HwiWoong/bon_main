import { Body, Controller, Inject, Post, Res, UseGuards } from "@nestjs/common";
import { BranchSessionGuard } from "../../common/guards/branch-session.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { SessionUser } from "@bon/entities";
import type { Response } from "express";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { ChatRequestDto } from "./dto/chat-request.dto";

@UseGuards(BranchSessionGuard)
@Controller("user")
export class ChatController {
  constructor(@Inject(ChatOrchestratorService) private readonly chatOrchestratorService: ChatOrchestratorService) {}

  @Post("chat")
  async chat(@CurrentUser() user: SessionUser, @Body() body: ChatRequestDto) {
    return this.chatOrchestratorService.handleChat(user.branchId!, body);
  }

  @Post("chat/stream")
  async streamChat(
    @CurrentUser() user: SessionUser,
    @Body() body: ChatRequestDto,
    @Res() response: Response
  ) {
    const { sessionId, stream, usageRef, fallbackToSm, references } =
      await this.chatOrchestratorService.handleStreamChat(user.branchId!, body);

    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");

    const send = (event: string, data: unknown) => {
      response.write(`event: ${event}\n`);
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send("meta", { session_id: sessionId, fallback_to_sm: fallbackToSm, references });

    try {
      for await (const chunk of stream) {
        send("chunk", { text: chunk });
      }

      if (usageRef.value) {
        send("usage", { usage: usageRef.value, cost: usageRef.cost });
      }
      send("end", usageRef.value ? { usage: usageRef.value, cost: usageRef.cost } : {});
      response.end();
    } catch {
      response.status(500);
      send("error", { message: "내부 오류가 발생했습니다." });
      response.end();
    }
  }
}
