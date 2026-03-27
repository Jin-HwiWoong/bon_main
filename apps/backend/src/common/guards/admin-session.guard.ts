import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { RequestWithSession } from "../types/request-with-session";

@Injectable()
export class AdminSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    if (request.session?.user?.role === "admin") {
      return true;
    }

    throw new UnauthorizedException("관리자 로그인 후 접근 가능합니다.");
  }
}
