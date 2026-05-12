import {
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

const FILTER_LOG_CONTEXT = 'AllExceptionsFilter';

type ExpressRequestLike = Request & {
  id?: string | number | object;
};

function responseMessageFromHttp(exception: HttpException): string | string[] {
  const body = exception.getResponse();
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const raw = (body as { message?: unknown }).message;
    if (typeof raw === 'string' || Array.isArray(raw)) return raw;
  }
  return exception.message;
}

/**
 * Catch-all: correlación con traceId (`req.id` desde pino-http) y nivel según código HTTP.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<ExpressRequestLike>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const traceIdRaw = req?.id as string | number | undefined;
    const traceId =
      typeof traceIdRaw === 'string' || typeof traceIdRaw === 'number'
        ? String(traceIdRaw)
        : undefined;

    let clientBody: Record<string, unknown>;

    if (exception instanceof HttpException) {
      const message = responseMessageFromHttp(exception);
      const base = exception.getResponse();
      clientBody =
        typeof base === 'object' && base !== null && !Array.isArray(base)
          ? { ...base }
          : { message };
      clientBody.statusCode ??= status;
      clientBody.message ??= message;
    } else {
      clientBody = {
        statusCode: status,
        message: status >= 500 ? 'Internal server error' : 'Error',
      };
    }

    if (traceId !== undefined) {
      clientBody.traceId = traceId;
    }

    const method = req?.method ?? 'UNKNOWN';
    const path = req?.originalUrl ?? req?.url ?? '';

    if (status >= 500) {
      const errPayload =
        exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        {
          err: errPayload,
          ...(exception instanceof Error && exception.stack
            ? { stack: exception.stack }
            : {}),
          traceId,
          method,
          path,
          statusCode: status,
        },
        'Unhandled exception',
        FILTER_LOG_CONTEXT,
      );
    } else if (exception instanceof HttpException) {
      this.logger.warn(
        {
          traceId,
          method,
          path,
          statusCode: status,
          err: {
            name: exception.name,
            message: exception.message,
          },
        },
        'Handled HTTP exception',
        FILTER_LOG_CONTEXT,
      );
    }

    res.status(status).json(clientBody);
  }
}
