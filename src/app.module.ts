import { Module } from '@nestjs/common';
import { CommodityProjectionService } from './services/commodity-projection.service';
import { CommodityProjectionController } from './controllers/commodity-projection.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT) ?? 5432,
      database: process.env.DB_NAME ?? 'report_meister_db',
      schema: process.env.DB_SCHEMA ?? 'report_meister',
      username: process.env.DB_USER ?? 'report_meister_user',
      password: process.env.DB_PASSWORD ?? 'secret',
      entities: [`${__dirname}/entities/**/*.entity.{ts,js}`],
      migrations: [`${__dirname}/migrations/**/*.{ts,js}`],
      migrationsRun: true,
      applicationName: 'report_meister',
      connectTimeoutMS: 2000,
      maxQueryExecutionTime: 1000,
      ssl: process.env.MODE === 'prod',
      retryAttempts: 100,
    }),
  ],
  controllers: [CommodityProjectionController],
  providers: [CommodityProjectionService],
})
export class AppModule {}
