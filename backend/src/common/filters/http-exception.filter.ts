import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ERROR_CODES } from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : isHttpException
          ? exception.message
          : 'Internal server error';

    response.status(status).json({
      success: false,
      errorCode: this.getErrorCode(status),
      message: Array.isArray(message) ? message.join(', ') : message,
      timestamp: new Date().toISOString(),
    });
  }

  private getErrorCode(status: number) {
    if (status === HttpStatus.UNAUTHORIZED) return ERROR_CODES.UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN) return ERROR_CODES.FORBIDDEN;
    if (status === HttpStatus.NOT_FOUND) return ERROR_CODES.NOT_FOUND;
    if (status === HttpStatus.BAD_REQUEST) return ERROR_CODES.VALIDATION_ERROR;
    return ERROR_CODES.INTERNAL_SERVER_ERROR;
  }
}
