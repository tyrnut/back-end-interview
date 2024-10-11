import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CONFIG, MODE_PROD } from '../config';

@Catch()
export class ServerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ServerExceptionFilter.name);
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (httpStatus >= 500) {
      this.logger.error(exception);
    }

    if (CONFIG.getMode() !== MODE_PROD) {
      const responseBody = {
        statusCode: httpStatus,
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(ctx.getRequest()),
      };
      httpAdapter.reply(
        ctx.getResponse(),
        { ResponseBody: responseBody, Exception: exception },
        httpStatus,
      );
    } else {
      httpAdapter.reply(ctx.getResponse(), undefined, httpStatus);
    }
  }
}
