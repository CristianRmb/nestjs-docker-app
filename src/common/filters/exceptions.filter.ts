import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any;
    if (exception instanceof HttpException) {
      message = exception.getResponse();
    } else if (exception instanceof Error) {
      // Extract the actual error message and stack for non-HTTP exceptions
      message = {
        message: exception.message,
        error: exception.name,
        stack: process.env.NODE_ENV === 'prod' ? undefined : exception.stack,
      };
    } else {
      message = { message: 'Internal server error' };
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
    };

    response.status(status).json(errorResponse);
  }
}
