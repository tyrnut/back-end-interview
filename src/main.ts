import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { NextFunction } from 'express';
import helmet from 'helmet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SUPPORTED_VERSIONS } from './constants';

// Initialize config
ConfigModule.forRoot();

// Logging middleware
const logger = new Logger('Http logger');
function httpLogger(req: Request, res: Response, next: NextFunction) {
  // Just an example
  logger.debug(`${req.url}`);
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      // This is all that is supported for now. Since this has to do with security, being cautious rather than opportunistic
      methods: ['GET'],
      // Use whatever is provided by the client for the purposes of this exercise, ignoring security
      origin: true,
    },
  });

  app.enableVersioning({
    defaultVersion: SUPPORTED_VERSIONS.at(SUPPORTED_VERSIONS.length - 1),
    type: VersioningType.URI,
  });

  const config = app.get(ConfigService);
  app.use(httpLogger, helmet());
  await app.listen(config.get<string>('API_PORT') ?? 3000);
}

bootstrap();
