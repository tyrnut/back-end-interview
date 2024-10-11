import { NestFactory } from '@nestjs/core';
import { LogLevel, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { SUPPORTED_VERSIONS } from './constants';
import { CONFIG, MODE_DEV, MODE_PROD } from './config';
import helmet from 'helmet';
import compression from 'compression';

// Initialize config
ConfigModule.forRoot();

async function bootstrap() {
  const logLevels: LogLevel[] = ['error', 'warn', 'fatal'];
  if (CONFIG.getMode() === MODE_DEV) {
    logLevels.push(...(['log', 'debug'] as LogLevel[]));
  } else if (CONFIG.getMode() !== MODE_PROD) {
    logLevels.push(...(['log', 'debug', 'verbose'] as LogLevel[]));
  }

  const app = await NestFactory.create(AppModule, {
    cors: {
      methods: ['GET'],
      // Set to true for demo purposes
      origin: true,
    },
    logger: logLevels,
  });

  app.enableVersioning({
    defaultVersion: SUPPORTED_VERSIONS.at(SUPPORTED_VERSIONS.length - 1),
    type: VersioningType.URI,
  });

  app.use(helmet(), compression());
  await app.listen(CONFIG.getApiPort() ?? 3000);
}

bootstrap();
