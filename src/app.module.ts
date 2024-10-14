import { Module } from '@nestjs/common';
import { CommodityProjectionService } from './services/commodity-projection.service';
import { CommodityProjectionController } from './controllers/commodity-projection.controller';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  makeSummaryProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { LoggingInterceptor } from './middleware/logging-interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CONFIG, MODE_PROD } from './config';
import { ServerExceptionFilter } from './middleware/server-exception-filter.filter';
import { METRIC_TRANSACTION_DURATION } from './constants';

const dbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: CONFIG.getDbHost() ?? 'localhost',
  port: CONFIG.getDbPort() ?? 5432,
  database: CONFIG.getDbName() ?? 'report_meister_db',
  schema: CONFIG.getDbSchema() ?? 'report_meister',
  username: CONFIG.getDbUser() ?? 'report_meister_user',
  password: CONFIG.getDbPassword() ?? 'secret',
  entities: [`${__dirname}/entities/**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/migrations/**/*.{ts,js}`],
  migrationsRun: true,
  applicationName: 'report_meister',
  connectTimeoutMS: 2000,
  maxQueryExecutionTime: 1000,
  ssl: CONFIG.getMode() === MODE_PROD,
  retryAttempts: 100,
};

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRoot(dbConfig),
    PrometheusModule.register(),
  ],
  controllers: [CommodityProjectionController],
  providers: [
    CommodityProjectionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ServerExceptionFilter,
    },
    makeSummaryProvider({
      name: METRIC_TRANSACTION_DURATION,
      help: 'Http transaction duration in milliseconds',
      maxAgeSeconds: 300,
      ageBuckets: 5,
      pruneAgedBuckets: false,
    }),
  ],
})
export class AppModule {}
