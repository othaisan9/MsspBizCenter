import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          errors = resp.message as string[];
          message = 'Validation failed';
        } else {
          message = (resp.message as string) || exception.message;
        }
      }
    } else {
      this.logger.error('Unhandled exception', exception);
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected error occurred';
      }
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
        errors,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
