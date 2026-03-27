import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import type { Request, Response } from "express";

type ErrorPayload = {
  ok: false;
  message: string;
  statusCode: number;
  path: string;
  timestamp: string;
  errors?: string[];
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.buildPayload(exception, request.url, statusCode);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(payload.message, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(statusCode).json(payload);
  }

  private buildPayload(exception: unknown, path: string, statusCode: number): ErrorPayload {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const normalized = normalizeHttpExceptionResponse(response);

      return {
        ok: false,
        message: normalized.message,
        statusCode,
        path,
        timestamp: new Date().toISOString(),
        errors: normalized.errors
      };
    }

    return {
      ok: false,
      message: exception instanceof Error ? exception.message : "내부 오류가 발생했습니다.",
      statusCode,
      path,
      timestamp: new Date().toISOString()
    };
  }
}

function normalizeHttpExceptionResponse(response: string | object) {
  if (typeof response === "string") {
    return {
      message: response,
      errors: undefined as string[] | undefined
    };
  }

  const normalizedResponse = response as Record<string, unknown>;

  const messageValue = normalizedResponse.message;
  if (Array.isArray(messageValue)) {
    return {
      message: messageValue[0] ?? "요청이 올바르지 않습니다.",
      errors: messageValue.map((item) => String(item))
    };
  }

  return {
    message: typeof messageValue === "string" ? messageValue : "요청 처리 중 오류가 발생했습니다.",
    errors: undefined as string[] | undefined
  };
}
