import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { SessionUser } from "@bon/entities";
import type { RequestWithSession } from "../types/request-with-session";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    return request.session?.user;
  }
);
