import { Module } from '@nestjs/common';
import { CommodityProjectionService } from './services/commodity-projection.service';
import { CommodityProjectionController } from './controllers/commodity-projection.controller';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  makeSummaryProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { LoggingInterceptor } from './middleware/logging-interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CONFIG, MODE_PROD } from './config';
import { ServerExceptionFilter } from './middleware/server-exception-filter.filter';
import * as constants from './constants';
import { CommodityProjectionRepositoryExt } from './repositories/commodity-projection.repo';
import { DataSource } from 'typeorm';
import { CommodityProjection } from './entities/commodity-projection.entity';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { CustomPrometheusController } from './controllers/prometheus.controller';

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
    TerminusModule,
    ConfigModule,
    TypeOrmModule.forRoot(dbConfig),
    PrometheusModule.register({
      controller: CustomPrometheusController,
    }),
  ],
  controllers: [CommodityProjectionController, HealthController],
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
    {
      provide: getRepositoryToken(CommodityProjection),
      inject: [getDataSourceToken()],
      useFactory(dataSource: DataSource) {
        return dataSource
          .getRepository(CommodityProjection)
          .extend({ ...new CommodityProjectionRepositoryExt() });
      },
    },
    makeSummaryProvider({
      name: constants.METRIC_TRANSACTION_DURATION,
      help: 'Http transaction duration in milliseconds',
      maxAgeSeconds: 300,
      ageBuckets: 5,
      pruneAgedBuckets: false,
    }),
  ],
})
export class AppModule {}
