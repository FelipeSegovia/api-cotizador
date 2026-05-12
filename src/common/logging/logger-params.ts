import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { Params } from 'nestjs-pino';
import type { Options } from 'pino-http';
import pino from 'pino';

type HttpRequestLike = IncomingMessage & {
  id?: string | number;
  /** Rellenado por JwtAuthGuard tras JWT válido */
  user?: { sub?: string };
};

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.cardNumber',
  'res.headers.set-cookie',
] as const;

function buildPinoHttpOptions(): Options {
  return {
    genReqId(req, res): string | number | object {
      void res;
      const raw = req.headers['x-request-id'];
      const headerId = Array.isArray(raw) ? raw[0] : raw;
      if (typeof headerId === 'string' && headerId.trim().length > 0) {
        return headerId.trim();
      }
      return randomUUID();
    },
    customProps(req: HttpRequestLike, res: ServerResponse): object {
      void res;
      const userId =
        req.user?.sub !== undefined && typeof req.user.sub === 'string'
          ? req.user.sub
          : undefined;

      const traceId =
        typeof req.id === 'string' || typeof req.id === 'number'
          ? req.id
          : undefined;

      return {
        ...(traceId !== undefined ? { traceId } : {}),
        ...(userId !== undefined ? { userId } : {}),
      };
    },
    redact: [...REDACT_PATHS],
    serializers: {
      req(req: IncomingMessage) {
        const headers = req.headers as Record<
          string,
          string | string[] | undefined
        >;
        return {
          method: req.method,
          url: req.url,
          remoteAddress: req.socket?.remoteAddress,
          userAgent: headers['user-agent'],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    customLogLevel(_req, res, err) {
      const statusCode = res.statusCode;
      if (err !== undefined || statusCode >= 500) return 'error';
      if (statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage(req, res, responseTime) {
      return `${req.method ?? ''} ${req.url ?? ''} ${res.statusCode} (${responseTime}ms)`;
    },
    customErrorMessage(req, res, err) {
      return `${req.method ?? ''} ${req.url ?? ''} ${res.statusCode} (${err.message})`;
    },
    autoLogging: {
      ignore(req) {
        const pathOnly = req.url?.split('?')[0] ?? '';
        return (
          pathOnly.startsWith('/api/docs') || pathOnly === '/api/docs-json'
        );
      },
    },
    messageKey: 'message',
    errorKey: 'err',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    level: process.env.LOG_LEVEL ?? 'info',
  };
}

/** Parámetros de `nestjs-pino` alineados con la guía interna de logging. */
export function buildLoggerParams(): Params {
  return {
    pinoHttp: buildPinoHttpOptions(),
  };
}
