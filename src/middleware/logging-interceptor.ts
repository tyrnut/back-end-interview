import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { METRIC_TRANSACTION_DURATION } from '../constants';
import { Summary } from 'prom-client';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  logger = new Logger(LoggingInterceptor.name);
  constructor(
    private readonly config: ConfigService,
    @InjectMetric(METRIC_TRANSACTION_DURATION)
    private readonly transactionDurationSummary: Summary<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;
        this.transactionDurationSummary.observe(duration);
        this.logger.debug(`${method} ${url} ${statusCode} - ${duration}ms`);
        this.logger.verbose('Response:', data);
      }),
    );
  }
}
